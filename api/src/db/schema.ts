import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar_url: text('avatar_url'),
  google_id: text('google_id').unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contentCalendarJobs = pgTable('content_calendar_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id),
  channel_url: text('channel_url').notNull(),
  channel_id: text('channel_id'),
  niche: text('niche').notNull(),
  preferences: text('preferences'),
  status: text('status').notNull(),
  current_step: text('current_step'),
  progress_percent: integer('progress_percent').default(0),
  error_message: text('error_message'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  index('idx_jobs_user_id').on(table.user_id),
]);

export const agentRuns = pgTable('agent_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  job_id: uuid('job_id').references(() => contentCalendarJobs.id),
  agent_name: text('agent_name').notNull(),
  status: text('status').notNull(),
  input_json: jsonb('input_json'),
  output_json: jsonb('output_json'),
  error_message: text('error_message'),
  started_at: timestamp('started_at', { withTimezone: true }),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  model_used: text('model_used'),
  prompt_version: text('prompt_version'),
  tokens_input: integer('tokens_input'),
  tokens_output: integer('tokens_output'),
  cost_usd: numeric('cost_usd'),
}, (table) => [
  index('idx_agent_runs_job_id').on(table.job_id),
]);

export const contentCalendars = pgTable('content_calendars', {
  id: uuid('id').defaultRandom().primaryKey(),
  job_id: uuid('job_id').unique().references(() => contentCalendarJobs.id),
  strategy_summary: text('strategy_summary'),
  channel_analysis: jsonb('channel_analysis'),
  trend_analysis: jsonb('trend_analysis'),
  topic_selection_rationale: text('topic_selection_rationale'),
  final_markdown: text('final_markdown'),
  quality_score: numeric('quality_score'),
  user_rating: integer('user_rating'),
  user_feedback: text('user_feedback'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const videoConcepts = pgTable('video_concepts', {
  id: uuid('id').defaultRandom().primaryKey(),
  calendar_id: uuid('calendar_id').references(() => contentCalendars.id),
  position: integer('position').notNull(),
  topic: text('topic').notNull(),
  content_type: text('content_type'),
  goal: text('goal'),
  recommended_title: text('recommended_title'),
  hook: text('hook'),
  outline_json: jsonb('outline_json'),
  retention_tactics: jsonb('retention_tactics'),
  cta_json: jsonb('cta_json'),
  seo_description: text('seo_description'),
  thumbnail_json: jsonb('thumbnail_json'),
  performance_prediction_json: jsonb('performance_prediction_json'),
  confidence_score: numeric('confidence_score'),
  evidence_json: jsonb('evidence_json'),
}, (table) => [
  index('idx_video_concepts_calendar_id').on(table.calendar_id),
]);

export const titleOptions = pgTable('title_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  video_concept_id: uuid('video_concept_id').references(() => videoConcepts.id),
  title: text('title').notNull(),
  seo_score: numeric('seo_score'),
  ctr_score: numeric('ctr_score'),
  rationale: text('rationale'),
  is_recommended: boolean('is_recommended').default(false),
}, (table) => [
  index('idx_title_options_concept_id').on(table.video_concept_id),
]);

export const seoKeywords = pgTable('seo_keywords', {
  id: uuid('id').defaultRandom().primaryKey(),
  video_concept_id: uuid('video_concept_id').references(() => videoConcepts.id),
  keyword: text('keyword').notNull(),
  keyword_type: text('keyword_type'),
  estimated_volume: text('estimated_volume'),
  competition: text('competition'),
  source: text('source'),
}, (table) => [
  index('idx_seo_keywords_concept_id').on(table.video_concept_id),
]);

export const externalApiCalls = pgTable('external_api_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  job_id: uuid('job_id').references(() => contentCalendarJobs.id),
  provider: text('provider'),
  endpoint: text('endpoint'),
  request_hash: text('request_hash'),
  response_cache_key: text('response_cache_key'),
  status_code: integer('status_code'),
  latency_ms: integer('latency_ms'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const llmCalls = pgTable('llm_calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  job_id: uuid('job_id').references(() => contentCalendarJobs.id),
  agent_run_id: uuid('agent_run_id').references(() => agentRuns.id),
  provider: text('provider'),
  model: text('model'),
  purpose: text('purpose'),
  prompt_hash: text('prompt_hash'),
  tokens_input: integer('tokens_input'),
  tokens_output: integer('tokens_output'),
  cost_usd: numeric('cost_usd'),
  latency_ms: integer('latency_ms'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('idx_llm_calls_job_id').on(table.job_id),
]);
