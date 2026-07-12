import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatar_url: text('avatar_url'),
  google_id: text('google_id').unique(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
