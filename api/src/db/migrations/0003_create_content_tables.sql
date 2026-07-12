CREATE TABLE "content_calendars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"strategy_summary" text,
	"channel_analysis" jsonb,
	"trend_analysis" jsonb,
	"topic_selection_rationale" text,
	"final_markdown" text,
	"quality_score" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_calendars_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "seo_keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_concept_id" uuid,
	"keyword" text NOT NULL,
	"keyword_type" text,
	"estimated_volume" text,
	"competition" text,
	"source" text
);
--> statement-breakpoint
CREATE TABLE "title_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_concept_id" uuid,
	"title" text NOT NULL,
	"seo_score" numeric,
	"ctr_score" numeric,
	"rationale" text,
	"is_recommended" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "video_concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_id" uuid,
	"position" integer NOT NULL,
	"topic" text NOT NULL,
	"content_type" text,
	"goal" text,
	"recommended_title" text,
	"hook" text,
	"outline_json" jsonb,
	"retention_tactics" jsonb,
	"cta_json" jsonb,
	"seo_description" text,
	"thumbnail_json" jsonb,
	"performance_prediction_json" jsonb,
	"confidence_score" numeric,
	"evidence_json" jsonb
);
--> statement-breakpoint
ALTER TABLE "content_calendars" ADD CONSTRAINT "content_calendars_job_id_content_calendar_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."content_calendar_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_keywords" ADD CONSTRAINT "seo_keywords_video_concept_id_video_concepts_id_fk" FOREIGN KEY ("video_concept_id") REFERENCES "public"."video_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "title_options" ADD CONSTRAINT "title_options_video_concept_id_video_concepts_id_fk" FOREIGN KEY ("video_concept_id") REFERENCES "public"."video_concepts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_concepts" ADD CONSTRAINT "video_concepts_calendar_id_content_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."content_calendars"("id") ON DELETE no action ON UPDATE no action;