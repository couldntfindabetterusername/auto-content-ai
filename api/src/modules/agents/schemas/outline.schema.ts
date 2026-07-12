import { z } from 'zod';

export const HookSchema = z.object({
  timestamp: z.string(),
  script: z.string(),
  visual_direction: z.string(),
});

export const OutlineSectionSchema = z.object({
  timestamp: z.string(),
  section: z.string(),
  talking_points: z.array(z.string()),
  visuals: z.array(z.string()),
  retention_purpose: z.string(),
});

export const RetentionHookSchema = z.object({
  timestamp: z.string(),
  line: z.string(),
  reason: z.string(),
});

export const CtaSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
});

export const VideoConceptSchema = z.object({
  topic: z.string(),
  target_audience: z.string(),
  estimated_length_minutes: z.number(),
  hook: HookSchema,
  outline: z.array(OutlineSectionSchema).min(6),
  retention_hooks: z.array(RetentionHookSchema).min(2),
  cta: CtaSchema,
});

export const OutlineGeneratorOutputSchema = z.object({
  video_concept: VideoConceptSchema,
});

export type Hook = z.infer<typeof HookSchema>;
export type OutlineSection = z.infer<typeof OutlineSectionSchema>;
export type RetentionHook = z.infer<typeof RetentionHookSchema>;
export type Cta = z.infer<typeof CtaSchema>;
export type VideoConcept = z.infer<typeof VideoConceptSchema>;
export type OutlineGeneratorOutput = z.infer<typeof OutlineGeneratorOutputSchema>;
