import { z } from 'zod';

export const QaIssueSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  section: z.string(),
  issue: z.string(),
  fix: z.string(),
});

export const QaResultSchema = z.object({
  quality_score: z.number().min(0).max(10),
  issues: z.array(QaIssueSchema),
  approved: z.boolean(),
});

export type QaIssue = z.infer<typeof QaIssueSchema>;
export type QaResult = z.infer<typeof QaResultSchema>;
