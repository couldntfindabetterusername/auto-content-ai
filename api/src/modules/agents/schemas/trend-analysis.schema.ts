import { z } from 'zod';

export const SourceSignalSchema = z.object({
  source: z.string(),
  evidence: z.string(),
});

export const TrendCandidateSchema = z.object({
  topic: z.string(),
  trend_type: z.enum(['rising', 'stable', 'evergreen']),
  source_signals: z.array(SourceSignalSchema),
  competition: z.enum(['low', 'medium', 'high']),
  channel_fit: z.enum(['low', 'medium', 'high']),
  opportunity_score: z.number().min(0).max(10),
  rationale: z.string(),
});

export const TrendAnalysisSchema = z.object({
  trend_candidates: z.array(TrendCandidateSchema),
});

export type TrendCandidate = z.infer<typeof TrendCandidateSchema>;
export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;
