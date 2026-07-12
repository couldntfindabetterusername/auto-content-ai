CREATE TABLE IF NOT EXISTS "agent_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"agent_name" text NOT NULL,
	"status" text NOT NULL,
	"input_json" jsonb,
	"output_json" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"model_used" text,
	"prompt_version" text,
	"tokens_input" integer,
	"tokens_output" integer,
	"cost_usd" numeric
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"agent_run_id" uuid,
	"provider" text,
	"model" text,
	"purpose" text,
	"prompt_hash" text,
	"tokens_input" integer,
	"tokens_output" integer,
	"cost_usd" numeric,
	"latency_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_job_id_content_calendar_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."content_calendar_jobs"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "llm_calls" ADD CONSTRAINT "llm_calls_job_id_content_calendar_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."content_calendar_jobs"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "llm_calls" ADD CONSTRAINT "llm_calls_agent_run_id_agent_runs_id_fk" FOREIGN KEY ("agent_run_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN NULL; END $$;