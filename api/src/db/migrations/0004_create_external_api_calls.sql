CREATE TABLE IF NOT EXISTS "external_api_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"provider" text,
	"endpoint" text,
	"request_hash" text,
	"response_cache_key" text,
	"status_code" integer,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "external_api_calls" ADD CONSTRAINT "external_api_calls_job_id_content_calendar_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."content_calendar_jobs"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;