import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { PromptLoader } from '../llm/prompt-loader';
import { ChannelAnalysisSchema } from './schemas/channel-analysis.schema';
import { SelectedTopicSchema } from './schemas/topic-selection.schema';
import { OutlineGeneratorOutputSchema, OutlineGeneratorOutput } from './schemas/outline.schema';
import { AgentOutput } from './agent.types';

const OutlineGeneratorInputSchema = z.object({
  topic: SelectedTopicSchema,
  channelAnalysis: ChannelAnalysisSchema,
  niche: z.string(),
});

type OutlineGeneratorInput = z.infer<typeof OutlineGeneratorInputSchema>;

@Injectable()
export class OutlineGeneratorAgent extends BaseAgent<OutlineGeneratorInput, OutlineGeneratorOutput> {
  readonly name = 'outline_generator';
  readonly modelClass: ModelClass = 'mid';
  readonly promptName = 'outline_generator';
  readonly promptVersion = 'v1';
  readonly inputSchema = OutlineGeneratorInputSchema;
  readonly outputSchema = OutlineGeneratorOutputSchema;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
    private readonly promptLoader: PromptLoader,
  ) {
    super(llmService, db);
  }

  buildPrompt(input: OutlineGeneratorInput): string {
    const { topic, channelAnalysis, niche } = input;

    const channelTraits = [
      `Summary: ${channelAnalysis.summary}`,
      `Formats: ${channelAnalysis.recommended_content_traits.formats.join(', ')}`,
      `Ideal length: ${channelAnalysis.recommended_content_traits.ideal_length_minutes} minutes`,
      `Tone: ${channelAnalysis.recommended_content_traits.tone}`,
      `Audience: ${channelAnalysis.audience_inferences.join('; ')}`,
      `Top patterns: ${channelAnalysis.top_performing_patterns.map((p) => p.pattern).join(', ')}`,
      `Avoid: ${channelAnalysis.avoid.join(', ')}`,
    ].join('\n');

    const schemaJson = JSON.stringify(
      {
        video_concept: {
          topic: 'string',
          target_audience: 'string',
          estimated_length_minutes: 'number',
          hook: {
            timestamp: 'string (e.g. "0:00-0:20")',
            script: 'string (≤30 words)',
            visual_direction: 'string',
          },
          outline: [
            {
              timestamp: 'string',
              section: 'string',
              talking_points: ['string'],
              visuals: ['string'],
              retention_purpose: 'string',
            },
          ],
          retention_hooks: [
            {
              timestamp: 'string',
              line: 'string',
              reason: 'string',
            },
          ],
          cta: {
            primary: 'string',
            secondary: 'string',
          },
        },
      },
      null,
      2,
    );

    const { template } = this.promptLoader.load(this.promptName);

    return this.promptLoader.render(template, {
      niche,
      topic: topic.topic,
      topicType: topic.type,
      whyNow: topic.why_now,
      differentiationAngle: topic.differentiation_angle,
      channelTraits,
      outputSchema: schemaJson,
    });
  }

  async runAll(
    topics: z.infer<typeof SelectedTopicSchema>[],
    channelAnalysis: z.infer<typeof ChannelAnalysisSchema>,
    niche: string,
    jobId: string,
    onProgress?: (completed: number, total: number) => Promise<void>,
  ): Promise<AgentOutput<OutlineGeneratorOutput>[]> {
    const total = topics.length;
    let completed = 0;

    const results = await Promise.all(
      topics.map(async (topic) => {
        const result = await this.run({ topic, channelAnalysis, niche }, jobId);
        completed++;
        if (onProgress) {
          await onProgress(completed, total).catch(() => undefined);
        }
        return result;
      }),
    );

    return results;
  }
}
