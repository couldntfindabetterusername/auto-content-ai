import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { contentCalendarJobs, llmCalls } from '../../db/schema';

export async function checkJobCostLimit(db: any, jobId: string): Promise<void> {
  const threshold = parseFloat(process.env.MAX_COST_PER_JOB_USD ?? '2');
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${llmCalls.cost_usd}::numeric), 0)::float` })
    .from(llmCalls)
    .where(eq(llmCalls.job_id, jobId));

  const total: number = row?.total ?? 0;
  if (total >= threshold) {
    throw new Error(`Cost limit exceeded: $${total.toFixed(4)} >= $${threshold}`);
  }
}

@Injectable()
export class QuotaService {
  constructor(@Inject('DB') private readonly db: any) {}

  async checkActiveJob(userId: string): Promise<void> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(contentCalendarJobs)
      .where(
        and(
          eq(contentCalendarJobs.user_id, userId),
          inArray(contentCalendarJobs.status, ['queued', 'running']),
        ),
      );

    if ((row?.count ?? 0) > 0) {
      throw new Error('You already have a running job');
    }
  }

  async checkDailyLimit(userId: string): Promise<void> {
    const maxPerDay = parseInt(process.env.MAX_JOBS_PER_DAY ?? '5', 10);
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(contentCalendarJobs)
      .where(
        and(
          eq(contentCalendarJobs.user_id, userId),
          gte(contentCalendarJobs.created_at, sql`NOW() - INTERVAL '1 day'`),
        ),
      );

    if ((row?.count ?? 0) >= maxPerDay) {
      throw new Error(`Daily limit reached. Max ${maxPerDay} jobs per day.`);
    }
  }
}
