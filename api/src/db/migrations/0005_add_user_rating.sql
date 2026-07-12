ALTER TABLE "content_calendars" ADD COLUMN IF NOT EXISTS "user_rating" integer;--> statement-breakpoint
ALTER TABLE "content_calendars" ADD COLUMN IF NOT EXISTS "user_feedback" text;