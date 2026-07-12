import { z } from 'zod';

export const PerformingPatternSchema = z.object({
  pattern: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const RecommendedContentTraitsSchema = z.object({
  ideal_length_minutes: z.string(),
  tone: z.string(),
  formats: z.array(z.string()),
});

export const ChannelAnalysisSchema = z.object({
  top_performing_patterns: z.array(PerformingPatternSchema),
  underperforming_patterns: z.array(PerformingPatternSchema),
  audience_inferences: z.array(z.string()),
  recommended_content_traits: RecommendedContentTraitsSchema,
  avoid: z.array(z.string()),
  summary: z.string(),
});

export type ChannelAnalysis = z.infer<typeof ChannelAnalysisSchema>;
