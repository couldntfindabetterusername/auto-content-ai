import { z } from 'zod';

export const SelectedTopicSchema = z.object({
  topic: z.string(),
  type: z.enum(['viral_trending', 'evergreen_seo', 'channel_fit', 'experimental_growth']),
  why_now: z.string(),
  why_this_channel: z.string(),
  risk: z.string(),
  differentiation_angle: z.string(),
});

export const RejectedTopicSchema = z.object({
  topic: z.string(),
  reason: z.string(),
});

export const TopicSelectionSchema = z.object({
  selected_topics: z.array(SelectedTopicSchema).length(4),
  rejected_topics: z.array(RejectedTopicSchema),
});

export type SelectedTopic = z.infer<typeof SelectedTopicSchema>;
export type RejectedTopic = z.infer<typeof RejectedTopicSchema>;
export type TopicSelection = z.infer<typeof TopicSelectionSchema>;
