import { z } from 'zod';

export const TitleOptionSchema = z.object({
  title: z.string(),
  seo_score: z.number().min(0).max(10),
  ctr_score: z.number().min(0).max(10),
  rationale: z.string(),
});

export const ThumbnailSchema = z.object({
  text_overlay: z.string(),
  visual_elements: z.array(z.string()),
  color_direction: z.string(),
});

export const PostingRecommendationSchema = z.object({
  day: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  basis: z.string(),
});

export const SeoPackageSchema = z.object({
  titles: z.array(TitleOptionSchema).length(3),
  recommended_title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).min(15).max(20),
  primary_keywords: z.array(z.string()),
  long_tail_keywords: z.array(z.string()),
  thumbnail: ThumbnailSchema,
  posting_recommendation: PostingRecommendationSchema,
});

export type TitleOption = z.infer<typeof TitleOptionSchema>;
export type Thumbnail = z.infer<typeof ThumbnailSchema>;
export type PostingRecommendation = z.infer<typeof PostingRecommendationSchema>;
export type SeoPackage = z.infer<typeof SeoPackageSchema>;
