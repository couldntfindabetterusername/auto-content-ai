import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
