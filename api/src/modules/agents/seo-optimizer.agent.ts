import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { PromptLoader } from '../llm/prompt-loader';
import { ChannelAnalysisSchema } from './schemas/channel-analysis.schema';
import { VideoConceptSchema } from './schemas/outline.schema';
import { SeoPackageSchema, SeoPackage } from './schemas/seo-package.schema';
import { AgentOutput } from './agent.types';

const SeoOptimizerInputSchema = z.object({
  videoConcept: VideoConceptSchema,
  channelAnalysis: ChannelAnalysisSchema,
  niche: z.string(),
});

type SeoOptimizerInput = z.infer<typeof SeoOptimizerInputSchema>;

@Injectable()
export class SeoOptimizerAgent extends BaseAgent<SeoOptimizerInput, SeoPackage> {
  readonly name = 'seo_optimizer';
  readonly modelClass: ModelClass = 'cheap';
  readonly promptName = 'seo_optimizer';
  readonly promptVersion = 'v1';
  readonly inputSchema = SeoOptimizerInputSchema;
  readonly outputSchema = SeoPackageSchema;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
    private readonly promptLoader: PromptLoader,
  ) {
    super(llmService, db);
  }

  buildPrompt(input: SeoOptimizerInput): string {
    const { videoConcept, channelAnalysis, niche } = input;

    const channelTraits = [
      `Summary: ${channelAnalysis.summary}`,
      `Formats: ${channelAnalysis.recommended_content_traits.formats.join(', ')}`,
      `Ideal length: ${channelAnalysis.recommended_content_traits.ideal_length_minutes} minutes`,
      `Tone: ${channelAnalysis.recommended_content_traits.tone}`,
      `Audience: ${channelAnalysis.audience_inferences.join('; ')}`,
      `Top patterns: ${channelAnalysis.top_performing_patterns.map((p) => p.pattern).join(', ')}`,
    ].join('\n');

    const schemaJson = JSON.stringify(
      {
        titles: [
          {
            title: 'string',
            seo_score: 'number (0-10)',
            ctr_score: 'number (0-10)',
            rationale: 'string',
          },
        ],
        recommended_title: 'string (must match one of the titles above)',
        description: 'string (250-300 words)',
        tags: ['string (15-20 tags)'],
        primary_keywords: ['string'],
        long_tail_keywords: ['string'],
        thumbnail: {
          text_overlay: 'string (≤5 words)',
          visual_elements: ['string'],
          color_direction: 'string',
        },
        posting_recommendation: {
          day: 'string',
          confidence: '"low"',
          basis: 'string',
        },
      },
      null,
      2,
    );

    const { template } = this.promptLoader.load(this.promptName);

    return this.promptLoader.render(template, {
      niche,
      topic: videoConcept.topic,
      targetAudience: videoConcept.target_audience,
      hook: videoConcept.hook.script,
      channelTraits,
      outputSchema: schemaJson,
    });
  }

  async runAll(
    videoConcepts: z.infer<typeof VideoConceptSchema>[],
    channelAnalysis: z.infer<typeof ChannelAnalysisSchema>,
    niche: string,
    jobId: string,
    onProgress?: (completed: number, total: number) => Promise<void>,
  ): Promise<AgentOutput<SeoPackage>[]> {
    const total = videoConcepts.length;
    let completed = 0;

    const results = await Promise.all(
      videoConcepts.map(async (videoConcept) => {
        const result = await this.run({ videoConcept, channelAnalysis, niche }, jobId);
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
