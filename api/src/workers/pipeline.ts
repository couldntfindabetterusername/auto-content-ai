import { eq } from 'drizzle-orm';
import { contentCalendarJobs } from '../db/schema';
import { checkJobCostLimit } from '../modules/quota/quota.service';
import type { InputValidator, ValidatedInput } from '../modules/agents/stages/input-validator';
import type { ChannelDataCollector } from '../modules/agents/stages/channel-data-collector';
import type { TrendDataCollector } from '../modules/agents/stages/trend-data-collector';
import type { ChannelAnalyzerAgent } from '../modules/agents/channel-analyzer.agent';
import type { TrendScoutAgent } from '../modules/agents/trend-scout.agent';
import type { TopicStrategistAgent } from '../modules/agents/topic-strategist.agent';
import type { OutlineGeneratorAgent } from '../modules/agents/outline-generator.agent';
import type { SeoOptimizerAgent } from '../modules/agents/seo-optimizer.agent';
import type { FinalQaAgent } from '../modules/agents/final-qa.agent';
import type { ContentCalendarService } from '../modules/content-calendar/content-calendar.service';
import type { ChannelAnalysis } from '../modules/agents/schemas/channel-analysis.schema';
import type { TrendAnalysis } from '../modules/agents/schemas/trend-analysis.schema';
import type { TopicSelection } from '../modules/agents/schemas/topic-selection.schema';
import type { VideoConcept } from '../modules/agents/schemas/outline.schema';
import type { SeoPackage } from '../modules/agents/schemas/seo-package.schema';
import type { QaResult } from '../modules/agents/schemas/qa-result.schema';

export interface PipelineInput {
  jobId: string;
  channelUrl: string;
  niche: string;
  preferences?: string;
}

export interface PipelineDeps {
  db: any;
  inputValidator: InputValidator;
  channelDataCollector: ChannelDataCollector;
  trendDataCollector: TrendDataCollector;
  channelAnalyzerAgent: ChannelAnalyzerAgent;
  trendScoutAgent: TrendScoutAgent;
  topicStrategistAgent: TopicStrategistAgent;
  outlineGeneratorAgent: OutlineGeneratorAgent;
  seoOptimizerAgent: SeoOptimizerAgent;
  finalQaAgent: FinalQaAgent;
  contentCalendarService: ContentCalendarService;
}

type PublishFn = (
  step: string,
  status: 'running' | 'done' | 'failed',
  error?: string,
) => Promise<void>;

export async function runPipeline(
  input: PipelineInput,
  deps: PipelineDeps,
  publish: PublishFn,
): Promise<void> {
  const { jobId, channelUrl, niche, preferences } = input;
  const { db } = deps;

  const setProgress = async (percent: number, step: string): Promise<void> => {
    await db
      .update(contentCalendarJobs)
      .set({ progress_percent: percent, current_step: step })
      .where(eq(contentCalendarJobs.id, jobId));
  };

  const failJob = async (message: string): Promise<void> => {
    await db
      .update(contentCalendarJobs)
      .set({ status: 'failed', error_message: message, completed_at: new Date() })
      .where(eq(contentCalendarJobs.id, jobId));
  };

  // Wraps each fatal stage: sets progress, emits SSE, fails job on error.
  const runStage = async <T>(
    name: string,
    percent: number,
    fn: () => Promise<T>,
  ): Promise<T> => {
    await setProgress(percent, name);
    await publish(name, 'running');
    try {
      const result = await fn();
      await publish(name, 'done');
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await failJob(msg);
      await publish(name, 'failed', msg);
      throw err;
    }
  };

  const costGuard = () => checkJobCostLimit(db, jobId);

  // Stage 1: Input Validator — 10%
  const validated: ValidatedInput = await runStage('validating_input', 10, async () =>
    deps.inputValidator.validate({ channelUrl, niche, preferences }),
  );

  // Stage 2: Channel Data Collector — 20%
  const channelData = await runStage('fetching_channel', 20, async () => {
    const data = await deps.channelDataCollector.collect(validated.channelUrl);
    await db
      .update(contentCalendarJobs)
      .set({ channel_id: data.channel.id })
      .where(eq(contentCalendarJobs.id, jobId));
    return data;
  });

  // Stage 3: Trend Data Collector — 30%
  const trendData = await runStage('researching_trends', 30, () =>
    deps.trendDataCollector.collect(validated.niche),
  );

  // Stage 4: Channel Analyzer — 40%
  const channelAnalysis: ChannelAnalysis = await runStage('analyzing_channel', 40, async () => {
    await costGuard();
    const result = await deps.channelAnalyzerAgent.run(
      { ...channelData, niche: validated.niche },
      jobId,
    );
    return result.data;
  });

  // Stage 5: Trend Scout — 50%
  const trendAnalysis: TrendAnalysis = await runStage('scouting_trends', 50, async () => {
    await costGuard();
    const result = await deps.trendScoutAgent.run(
      { niche: validated.niche, channelAnalysis, trendData },
      jobId,
    );
    return result.data;
  });

  // Stage 6: Topic Strategist — 60%
  const topicSelection: TopicSelection = await runStage('selecting_topics', 60, async () => {
    await costGuard();
    const result = await deps.topicStrategistAgent.run(
      {
        niche: validated.niche,
        channelAnalysis,
        trendCandidates: trendAnalysis.trend_candidates,
        preferences: validated.preferences,
      },
      jobId,
    );
    return result.data;
  });

  // Stage 7: Outline Generator x4 parallel — 62→75%
  const videoConcepts: VideoConcept[] = await runStage('generating_outlines', 62, async () => {
    await costGuard();
    const results = await deps.outlineGeneratorAgent.runAll(
      topicSelection.selected_topics,
      channelAnalysis,
      validated.niche,
      jobId,
      async (completed, total) => {
        const pct = 62 + Math.round((completed / total) * 13);
        await setProgress(pct, 'generating_outlines');
      },
    );
    return results.map((r) => r.data.video_concept);
  });

  // Stage 8: SEO Optimizer x4 parallel — 75% (partial failure allowed)
  await costGuard();
  await setProgress(75, 'optimizing_seo');
  await publish('optimizing_seo', 'running');

  const successfulConcepts: VideoConcept[] = [];
  const successfulSeoPackages: SeoPackage[] = [];

  const seoSettled = await Promise.allSettled(
    videoConcepts.map((concept) =>
      deps.seoOptimizerAgent.run(
        { videoConcept: concept, channelAnalysis, niche: validated.niche },
        jobId,
      ),
    ),
  );

  for (let i = 0; i < seoSettled.length; i++) {
    const r = seoSettled[i];
    if (r.status === 'fulfilled') {
      successfulConcepts.push(videoConcepts[i]);
      successfulSeoPackages.push(r.value.data);
    }
  }

  if (successfulConcepts.length === 0) {
    const msg = 'All SEO optimization tasks failed';
    await failJob(msg);
    await publish('optimizing_seo', 'failed', msg);
    throw new Error(msg);
  }

  await publish('optimizing_seo', 'done');
  const isPartial = successfulConcepts.length < videoConcepts.length;

  // Stage 9: Final QA — 90% (skipped on partial failure, non-fatal on error)
  await setProgress(90, 'qa_check');
  let qaResult: QaResult | undefined;

  if (!isPartial) {
    await publish('qa_check', 'running');
    try {
      const result = await deps.finalQaAgent.runQa(
        channelAnalysis,
        successfulConcepts,
        successfulSeoPackages,
        validated.niche,
        jobId,
      );
      qaResult = result.data;
      await publish('qa_check', 'done');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[pipeline] QA failed (non-fatal): ${msg}`);
      await publish('qa_check', 'failed', msg);
    }
  }

  // Save results — fatal if this fails
  try {
    await deps.contentCalendarService.saveResults({
      jobId,
      channelAnalysis,
      trendAnalysis,
      topicSelection,
      videoConcepts: successfulConcepts,
      seoPackages: successfulSeoPackages,
      qaResult,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await failJob(msg);
    await publish('save_results', 'failed', msg);
    throw err;
  }

  const finalStatus = isPartial ? 'partial_completed' : 'completed';
  await setProgress(100, finalStatus);
  await db
    .update(contentCalendarJobs)
    .set({ status: finalStatus, completed_at: new Date() })
    .where(eq(contentCalendarJobs.id, jobId));

  await publish('pipeline_complete', 'done');
}
