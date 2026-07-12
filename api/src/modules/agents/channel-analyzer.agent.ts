import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { PromptLoader } from '../llm/prompt-loader';
import { ChannelAnalysisSchema, ChannelAnalysis } from './schemas/channel-analysis.schema';

const ChannelAnalyzerInputSchema = z.object({
  channel: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    subscriberCount: z.number(),
  }),
  videos: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      publishedAt: z.string(),
      durationSeconds: z.number(),
      viewCount: z.number(),
      likeCount: z.number(),
      commentCount: z.number(),
      tags: z.array(z.string()),
    }),
  ),
  metrics: z.object({
    videoCount: z.number(),
    avgViews: z.number(),
    medianViews: z.number(),
    avgLikeRate: z.number(),
    avgCommentRate: z.number(),
    avgViewVelocity: z.number(),
    uploadFrequencyDays: z.number(),
    topVideos: z.array(z.object({ id: z.string(), title: z.string(), viewCount: z.number(), publishedAt: z.string() })),
    bottomVideos: z.array(z.object({ id: z.string(), title: z.string(), viewCount: z.number(), publishedAt: z.string() })),
    formatGuesses: z.array(z.object({ format: z.string(), count: z.number() })),
    durationBuckets: z.array(z.object({ label: z.string(), count: z.number(), avgViews: z.number() })),
    keywordFrequency: z.array(z.object({ word: z.string(), count: z.number() })),
  }),
  niche: z.string(),
});

type ChannelAnalyzerInput = z.infer<typeof ChannelAnalyzerInputSchema>;

@Injectable()
export class ChannelAnalyzerAgent extends BaseAgent<ChannelAnalyzerInput, ChannelAnalysis> {
  readonly name = 'channel_analyzer';
  readonly modelClass: ModelClass = 'mid';
  readonly promptName = 'channel_analyzer';
  readonly promptVersion = 'v1';
  readonly inputSchema = ChannelAnalyzerInputSchema;
  readonly outputSchema = ChannelAnalysisSchema;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
    private readonly promptLoader: PromptLoader,
  ) {
    super(llmService, db);
  }

  buildPrompt(input: ChannelAnalyzerInput): string {
    const top10 = [...input.videos]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    const videoStats = top10
      .map(
        (v) =>
          `- "${v.title}" | views: ${v.viewCount} | likes: ${v.likeCount} | comments: ${v.commentCount} | duration: ${Math.round(v.durationSeconds / 60)}min | published: ${v.publishedAt}`,
      )
      .join('\n');

    const metricsSummary = [
      `Avg views: ${Math.round(input.metrics.avgViews)}`,
      `Median views: ${Math.round(input.metrics.medianViews)}`,
      `Avg like rate: ${(input.metrics.avgLikeRate * 100).toFixed(2)}%`,
      `Avg comment rate: ${(input.metrics.avgCommentRate * 100).toFixed(2)}%`,
      `Upload frequency: every ${input.metrics.uploadFrequencyDays.toFixed(1)} days`,
      `Top formats: ${input.metrics.formatGuesses.map((f) => f.format).join(', ')}`,
    ].join('\n');

    const schemaJson = JSON.stringify(
      {
        top_performing_patterns: [{ pattern: 'string', evidence: ['string'], confidence: 'number 0-1' }],
        underperforming_patterns: [{ pattern: 'string', evidence: ['string'], confidence: 'number 0-1' }],
        audience_inferences: ['string'],
        recommended_content_traits: { ideal_length_minutes: 'string', tone: 'string', formats: ['string'] },
        avoid: ['string'],
        summary: 'string',
      },
      null,
      2,
    );

    const { template } = this.promptLoader.load(this.promptName);

    return this.promptLoader.render(template, {
      channelName: input.channel.title,
      niche: input.niche,
      subscriberCount: String(input.channel.subscriberCount),
      videoCount: String(input.videos.length),
      videoStats: `${videoStats}\n\nChannel metrics summary:\n${metricsSummary}`,
      outputSchema: schemaJson,
    });
  }
}
