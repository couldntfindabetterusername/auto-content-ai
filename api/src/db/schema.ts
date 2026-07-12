import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
});

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
});
