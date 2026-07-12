import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { PromptLoader } from '../llm/prompt-loader';
import { ChannelAnalysisSchema } from './schemas/channel-analysis.schema';
import { TrendAnalysisSchema, TrendAnalysis } from './schemas/trend-analysis.schema';

const TrendScoutInputSchema = z.object({
  niche: z.string(),
  channelAnalysis: ChannelAnalysisSchema,
  trendData: z.object({
    youtubeSearch: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        channelTitle: z.string(),
        viewCount: z.number(),
        publishedAt: z.string(),
        viewVelocity: z.number(),
      }),
    ),
    googleTrends: z.object({
      signals: z.array(
        z.object({
          query: z.string(),
          risingPercent: z.number(),
          relatedTopics: z.array(z.string()),
          trendDirection: z.enum(['rising', 'falling', 'stable']),
        }),
      ),
      confidence: z.enum(['ok', 'degraded']),
    }),
  }),
});

type TrendScoutInput = z.infer<typeof TrendScoutInputSchema>;

@Injectable()
export class TrendScoutAgent extends BaseAgent<TrendScoutInput, TrendAnalysis> {
  readonly name = 'trend_scout';
  readonly modelClass: ModelClass = 'mid';
  readonly promptName = 'trend_scout';
  readonly promptVersion = 'v1';
  readonly inputSchema = TrendScoutInputSchema;
  readonly outputSchema = TrendAnalysisSchema;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
    private readonly promptLoader: PromptLoader,
  ) {
    super(llmService, db);
  }

  buildPrompt(input: TrendScoutInput): string {
    const top15yt = [...input.trendData.youtubeSearch]
      .sort((a, b) => b.viewVelocity - a.viewVelocity)
      .slice(0, 15);

    const ytSection =
      top15yt.length > 0
        ? top15yt
            .map(
              (v) =>
                `- "${v.title}" by ${v.channelTitle} | views: ${v.viewCount} | velocity: ${v.viewVelocity.toFixed(1)} views/day | published: ${v.publishedAt}`,
            )
            .join('\n')
        : 'No YouTube search data available.';

    const trendsSection =
      input.trendData.googleTrends.confidence === 'degraded' || input.trendData.googleTrends.signals.length === 0
        ? 'Google Trends data unavailable (rate limited or degraded).'
        : input.trendData.googleTrends.signals
            .slice(0, 10)
            .map(
              (s) =>
                `- "${s.query}" | direction: ${s.trendDirection} | rising: ${s.risingPercent}% | related: ${s.relatedTopics.slice(0, 3).join(', ')}`,
            )
            .join('\n');

    const trendData = `YouTube niche search (sorted by view velocity):\n${ytSection}\n\nGoogle Trends rising queries:\n${trendsSection}`;

    const channelSummary = [
      `Summary: ${input.channelAnalysis.summary}`,
      `Recommended formats: ${input.channelAnalysis.recommended_content_traits.formats.join(', ')}`,
      `Ideal length: ${input.channelAnalysis.recommended_content_traits.ideal_length_minutes} minutes`,
      `Tone: ${input.channelAnalysis.recommended_content_traits.tone}`,
      `Audience inferences: ${input.channelAnalysis.audience_inferences.join('; ')}`,
      `Avoid: ${input.channelAnalysis.avoid.join(', ')}`,
    ].join('\n');

    const schemaJson = JSON.stringify(
      {
        trend_candidates: [
          {
            topic: 'string',
            trend_type: 'rising | stable | evergreen',
            source_signals: [{ source: 'youtube_search | google_trends', evidence: 'string' }],
            competition: 'low | medium | high',
            channel_fit: 'low | medium | high',
            opportunity_score: 'number 0-10',
            rationale: 'string',
          },
        ],
      },
      null,
      2,
    );

    const { template } = this.promptLoader.load(this.promptName);

    return this.promptLoader.render(template, {
      niche: input.niche,
      channelSummary,
      trendData,
      outputSchema: schemaJson,
    });
  }
}
