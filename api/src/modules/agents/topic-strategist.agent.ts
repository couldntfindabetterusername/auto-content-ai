import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { PromptLoader } from '../llm/prompt-loader';
import { ChannelAnalysisSchema } from './schemas/channel-analysis.schema';
import { TrendCandidateSchema } from './schemas/trend-analysis.schema';
import { TopicSelectionSchema, TopicSelection } from './schemas/topic-selection.schema';

const TopicStrategistInputSchema = z.object({
  niche: z.string(),
  channelAnalysis: ChannelAnalysisSchema,
  trendCandidates: z.array(TrendCandidateSchema),
  preferences: z.string().optional(),
});

type TopicStrategistInput = z.infer<typeof TopicStrategistInputSchema>;

@Injectable()
export class TopicStrategistAgent extends BaseAgent<TopicStrategistInput, TopicSelection> {
  readonly name = 'topic_strategist';
  readonly modelClass: ModelClass = 'strong';
  readonly promptName = 'topic_strategist';
  readonly promptVersion = 'v1';
  readonly inputSchema = TopicStrategistInputSchema;
  readonly outputSchema = TopicSelectionSchema;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
    private readonly promptLoader: PromptLoader,
  ) {
    super(llmService, db);
  }

  buildPrompt(input: TopicStrategistInput): string {
    const channelSummary = [
      `Summary: ${input.channelAnalysis.summary}`,
      `Recommended formats: ${input.channelAnalysis.recommended_content_traits.formats.join(', ')}`,
      `Ideal length: ${input.channelAnalysis.recommended_content_traits.ideal_length_minutes} minutes`,
      `Tone: ${input.channelAnalysis.recommended_content_traits.tone}`,
      `Audience inferences: ${input.channelAnalysis.audience_inferences.join('; ')}`,
      `Avoid: ${input.channelAnalysis.avoid.join(', ')}`,
    ].join('\n');

    const sortedCandidates = [...input.trendCandidates].sort(
      (a, b) => b.opportunity_score - a.opportunity_score,
    );
    const candidatesSection = sortedCandidates
      .map(
        (c) =>
          `- "${c.topic}" | type: ${c.trend_type} | fit: ${c.channel_fit} | competition: ${c.competition} | score: ${c.opportunity_score} | rationale: ${c.rationale}`,
      )
      .join('\n');

    const schemaJson = JSON.stringify(
      {
        selected_topics: [
          {
            topic: 'string',
            type: 'viral_trending | evergreen_seo | channel_fit | experimental_growth',
            why_now: 'string',
            why_this_channel: 'string',
            risk: 'string',
            differentiation_angle: 'string',
          },
        ],
        rejected_topics: [{ topic: 'string', reason: 'string' }],
      },
      null,
      2,
    );

    const { template } = this.promptLoader.load(this.promptName);

    return this.promptLoader.render(template, {
      niche: input.niche,
      channelSummary,
      trendCandidates: candidatesSection,
      preferences: input.preferences ?? 'None provided.',
      outputSchema: schemaJson,
    });
  }
}
