CREATE TABLE IF NOT EXISTS "content_calendar_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"channel_url" text NOT NULL,
	"channel_id" text,
	"niche" text NOT NULL,
	"preferences" text,
	"status" text NOT NULL,
	"current_step" text,
	"progress_percent" integer DEFAULT 0,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "content_calendar_jobs" ADD CONSTRAINT "content_calendar_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;