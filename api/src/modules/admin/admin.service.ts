import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { sql, eq, desc } from 'drizzle-orm';
import {
  contentCalendarJobs,
  users,
  agentRuns,
  llmCalls,
  contentCalendars,
} from '../../db/schema';

@Injectable()
export class AdminService {
  constructor(@Inject('DB') private readonly db: any) {}

  async getJobs(limit = 50) {
    const rows = await this.db
      .select({
        id: contentCalendarJobs.id,
        status: contentCalendarJobs.status,
        channel_url: contentCalendarJobs.channel_url,
        channel_id: contentCalendarJobs.channel_id,
        niche: contentCalendarJobs.niche,
        created_at: contentCalendarJobs.created_at,
        started_at: contentCalendarJobs.started_at,
        completed_at: contentCalendarJobs.completed_at,
        error_message: contentCalendarJobs.error_message,
        user_email: users.email,
        user_name: users.name,
        total_cost_usd: sql<number>`COALESCE(SUM(${llmCalls.cost_usd}::numeric), 0)::float`,
        quality_score: contentCalendars.quality_score,
      })
      .from(contentCalendarJobs)
      .leftJoin(users, eq(contentCalendarJobs.user_id, users.id))
      .leftJoin(llmCalls, eq(llmCalls.job_id, contentCalendarJobs.id))
      .leftJoin(contentCalendars, eq(contentCalendars.job_id, contentCalendarJobs.id))
      .groupBy(
        contentCalendarJobs.id,
        users.email,
        users.name,
        contentCalendars.quality_score,
      )
      .orderBy(desc(contentCalendarJobs.created_at))
      .limit(limit);

    return rows.map((r: any) => ({
      ...r,
      duration_ms:
        r.completed_at && r.started_at
          ? new Date(r.completed_at).getTime() - new Date(r.started_at).getTime()
          : null,
    }));
  }

  async getJobAgentRuns(jobId: string) {
    const [job] = await this.db
      .select({ id: contentCalendarJobs.id })
      .from(contentCalendarJobs)
      .where(eq(contentCalendarJobs.id, jobId));

    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    return this.db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.job_id, jobId))
      .orderBy(agentRuns.started_at);
  }

  async getStats() {
    const rows = await this.db.execute(sql`
      SELECT
        COUNT(j.id)::int AS total_jobs,
        COALESCE(AVG(llm.total_cost)::numeric, 0)::float AS avg_cost_usd,
        COALESCE(AVG(cc.quality_score::numeric), 0)::float AS avg_qa_score,
        COALESCE(AVG(CASE WHEN j.status = 'failed' THEN 1.0 ELSE 0.0 END), 0)::float AS failure_rate
      FROM content_calendar_jobs j
      LEFT JOIN content_calendars cc ON cc.job_id = j.id
      LEFT JOIN (
        SELECT job_id, SUM(cost_usd::numeric) AS total_cost
        FROM llm_calls
        GROUP BY job_id
      ) llm ON llm.job_id = j.id
    `);

    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    return row ?? { total_jobs: 0, avg_cost_usd: 0, avg_qa_score: 0, failure_rate: 0 };
  }
}
