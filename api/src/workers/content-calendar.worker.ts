import 'dotenv/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { eq } from 'drizzle-orm';
import { createDb } from '../db/index';
import { contentCalendarJobs } from '../db/schema';
import { YoutubeService } from '../modules/youtube/youtube.service';
import { MetricsService } from '../modules/youtube/metrics.service';
import { TrendsService } from '../modules/trends/trends.service';
import { InputValidator } from '../modules/agents/stages/input-validator';
import { ChannelDataCollector } from '../modules/agents/stages/channel-data-collector';
import { TrendDataCollector } from '../modules/agents/stages/trend-data-collector';
import { GeminiProvider } from '../modules/llm/providers/gemini.provider';
import { LlmProviderFactory } from '../modules/llm/llm-provider.factory';
import { LlmService } from '../modules/llm/llm.service';
import { PromptLoader } from '../modules/llm/prompt-loader';
import { ChannelAnalyzerAgent } from '../modules/agents/channel-analyzer.agent';
import { TrendScoutAgent } from '../modules/agents/trend-scout.agent';
import { TopicStrategistAgent } from '../modules/agents/topic-strategist.agent';
import { OutlineGeneratorAgent } from '../modules/agents/outline-generator.agent';
import { SeoOptimizerAgent } from '../modules/agents/seo-optimizer.agent';
import { FinalQaAgent } from '../modules/agents/final-qa.agent';
import { CalendarPersistenceService } from '../modules/content-calendar/calendar-persistence.service';
import { runPipeline } from './pipeline';

(async () => {
  const db = await createDb();

  const publisher = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  });

  // Minimal ConfigService shim — lets services read from process.env
  const envConfig = {
    getOrThrow: <T>(key: string): T => {
      const v = process.env[key];
      if (!v) throw new Error(`Missing env var: ${key}`);
      return v as unknown as T;
    },
    get: <T>(key: string, defaultVal?: T): T =>
      (process.env[key] as unknown as T) ?? defaultVal!,
  };

  const youtubeService = new YoutubeService(envConfig as any);
  youtubeService.onModuleInit();

  const metricsService = new MetricsService();
  const trendsService = new TrendsService(envConfig as any, db);
  trendsService.onModuleInit();

  const geminiProvider = new GeminiProvider(envConfig as any);
  const providerFactory = new LlmProviderFactory(geminiProvider);
  const llmService = new LlmService(envConfig as any, db, providerFactory);
  const promptLoader = new PromptLoader();

  const inputValidator = new InputValidator();
  const channelDataCollector = new ChannelDataCollector(youtubeService, metricsService);
  const trendDataCollector = new TrendDataCollector(youtubeService, trendsService);
  const channelAnalyzerAgent = new ChannelAnalyzerAgent(llmService, db, promptLoader);
  const trendScoutAgent = new TrendScoutAgent(llmService, db, promptLoader);
  const topicStrategistAgent = new TopicStrategistAgent(llmService, db, promptLoader);
  const outlineGeneratorAgent = new OutlineGeneratorAgent(llmService, db, promptLoader);
  const seoOptimizerAgent = new SeoOptimizerAgent(llmService, db, promptLoader);
  const finalQaAgent = new FinalQaAgent(llmService, db, promptLoader);
  const contentCalendarService = new CalendarPersistenceService(db);

  async function publishProgress(
    jobId: string,
    step: string,
    status: 'running' | 'done' | 'failed',
    progress: number,
    error?: string,
  ): Promise<void> {
    try {
      await publisher.publish(
        `job:${jobId}:progress`,
        JSON.stringify({
          step,
          status,
          progress,
          ...(error ? { error } : {}),
        }),
      );
    } catch {
      // non-fatal
    }
  }

  const worker = new Worker(
    'content-calendar',
    async (job) => {
      const { jobId, channelUrl, niche, preferences } = job.data as {
        jobId: string;
        channelUrl: string;
        niche: string;
        preferences?: string;
      };

      await db
        .update(contentCalendarJobs)
        .set({ status: 'running', current_step: 'starting', started_at: new Date() })
        .where(eq(contentCalendarJobs.id, jobId));

      try {
        await runPipeline(
          { jobId, channelUrl, niche, preferences },
          {
            db,
            inputValidator,
            channelDataCollector,
            trendDataCollector,
            channelAnalyzerAgent,
            trendScoutAgent,
            topicStrategistAgent,
            outlineGeneratorAgent,
            seoOptimizerAgent,
            finalQaAgent,
            contentCalendarService,
          },
          (step, status, progress, error) => publishProgress(jobId, step, status, progress, error),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await publishProgress(jobId, 'pipeline_complete', 'failed', 100, msg);
        throw err;
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    },
  );

  worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
})().catch((err) => {
  console.error('Worker init failed:', err);
  process.exit(1);
});
