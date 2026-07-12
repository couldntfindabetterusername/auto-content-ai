CREATE INDEX "idx_agent_runs_job_id" ON "agent_runs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_user_id" ON "content_calendar_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_llm_calls_job_id" ON "llm_calls" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_seo_keywords_concept_id" ON "seo_keywords" USING btree ("video_concept_id");--> statement-breakpoint
CREATE INDEX "idx_title_options_concept_id" ON "title_options" USING btree ("video_concept_id");--> statement-breakpoint
CREATE INDEX "idx_video_concepts_calendar_id" ON "video_concepts" USING btree ("calendar_id");