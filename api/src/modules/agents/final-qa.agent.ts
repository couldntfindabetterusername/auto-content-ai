import { Injectable, Inject } from '@nestjs/common';
import { z } from 'zod';
import { BaseAgent } from './base-agent';
import { LlmService } from '../llm/llm.service';
import { ModelClass } from '../llm/llm.types';
import { PromptLoader } from '../llm/prompt-loader';
import { ChannelAnalysisSchema } from './schemas/channel-analysis.schema';
import { VideoConceptSchema } from './schemas/outline.schema';
import { SeoPackageSchema } from './schemas/seo-package.schema';
import { QaResultSchema, QaResult } from './schemas/qa-result.schema';
import { AgentOutput } from './agent.types';

const FinalQaInputSchema = z.object({
  channelAnalysis: ChannelAnalysisSchema,
  videoConcepts: z.array(VideoConceptSchema).length(4),
  seoPackages: z.array(SeoPackageSchema).length(4),
  niche: z.string(),
});

type FinalQaInput = z.infer<typeof FinalQaInputSchema>;

@Injectable()
export class FinalQaAgent extends BaseAgent<FinalQaInput, QaResult> {
  readonly name = 'final_qa';
  readonly modelClass: ModelClass = 'strong';
  readonly promptName = 'final_qa';
  readonly promptVersion = 'v1';
  readonly inputSchema = FinalQaInputSchema;
  readonly outputSchema = QaResultSchema;

  constructor(
    protected readonly llmService: LlmService,
    @Inject('DB') protected readonly db: any,
    private readonly promptLoader: PromptLoader,
  ) {
    super(llmService, db);
  }

  buildPrompt(input: FinalQaInput): string {
    const { channelAnalysis, videoConcepts, seoPackages, niche } = input;

    const videoPackages = videoConcepts
      .map((concept, i) => {
        const seo = seoPackages[i];
        return [
          `--- Video ${i + 1} ---`,
          `Topic: ${concept.topic}`,
          `Target Audience: ${concept.target_audience}`,
          `Estimated Length: ${concept.estimated_length_minutes} minutes`,
          `Hook: ${concept.hook.script}`,
          `Outline sections: ${concept.outline.map((s) => s.section).join(', ')}`,
          `Retention hooks: ${concept.retention_hooks.map((h) => h.line).join('; ')}`,
          `CTA: ${concept.cta.primary}`,
          ``,
          `SEO Package ${i + 1}:`,
          `Recommended Title: ${seo.recommended_title}`,
          `Tags: ${seo.tags.join(', ')}`,
          `Primary Keywords: ${seo.primary_keywords.join(', ')}`,
          `Thumbnail Overlay: ${seo.thumbnail.text_overlay}`,
          `Posting Day: ${seo.posting_recommendation.day}`,
        ].join('\n');
      })
      .join('\n\n');

    const schemaJson = JSON.stringify(
      {
        quality_score: 'number (0-10)',
        issues: [
          {
            severity: '"low" | "medium" | "high"',
            section: 'string (e.g., "Video 2 Outline", "Video 3 SEO", "Overall")',
            issue: 'string',
            fix: 'string',
          },
        ],
        approved: 'boolean',
      },
      null,
      2,
    );

    const { template } = this.promptLoader.load(this.promptName);

    return this.promptLoader.render(template, {
      niche,
      channelSummary: channelAnalysis.summary,
      channelFormats: channelAnalysis.recommended_content_traits.formats.join(', '),
      channelTone: channelAnalysis.recommended_content_traits.tone,
      videoPackages,
      outputSchema: schemaJson,
    });
  }

  async runQa(
    channelAnalysis: z.infer<typeof ChannelAnalysisSchema>,
    videoConcepts: z.infer<typeof VideoConceptSchema>[],
    seoPackages: z.infer<typeof SeoPackageSchema>[],
    niche: string,
    jobId: string,
  ): Promise<AgentOutput<QaResult>> {
    return this.run({ channelAnalysis, videoConcepts, seoPackages, niche }, jobId);
  }
}
