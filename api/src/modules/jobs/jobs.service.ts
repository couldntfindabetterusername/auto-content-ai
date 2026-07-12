import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { and, eq } from 'drizzle-orm';
import { contentCalendarJobs } from '../../db/schema';
import { JobsGateway } from './jobs.gateway';

@Injectable()
export class JobsService {
  constructor(
    @Inject('DB') private readonly db: any,
    private readonly gateway: JobsGateway,
  ) {}

  async getJobStatus(jobId: string, userId: string) {
    const [job] = await this.db
      .select({
        id: contentCalendarJobs.id,
        status: contentCalendarJobs.status,
        currentStep: contentCalendarJobs.current_step,
        progressPercent: contentCalendarJobs.progress_percent,
        errorMessage: contentCalendarJobs.error_message,
        createdAt: contentCalendarJobs.created_at,
        startedAt: contentCalendarJobs.started_at,
        completedAt: contentCalendarJobs.completed_at,
      })
      .from(contentCalendarJobs)
      .where(and(eq(contentCalendarJobs.id, jobId), eq(contentCalendarJobs.user_id, userId)))
      .limit(1);

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async subscribeToJobProgress(jobId: string): Promise<Observable<MessageEvent>> {
    const [job] = await this.db
      .select({ id: contentCalendarJobs.id })
      .from(contentCalendarJobs)
      .where(eq(contentCalendarJobs.id, jobId))
      .limit(1);

    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const channel = `job:${jobId}:progress`;
    const messages = await this.gateway.subscribe(channel);

    return new Observable<MessageEvent>(subscriber => {
      let heartbeat: NodeJS.Timeout | null = null;

      (async () => {
        try {
          heartbeat = setInterval(() => {
            if (!subscriber.closed) {
              subscriber.next({ data: '', type: 'heartbeat' });
            }
          }, 15000);

          for await (const msg of messages) {
            if (subscriber.closed) break;
            try {
              const data = JSON.parse(msg) as {
                step: string;
                status: 'running' | 'done' | 'failed';
                progress: number;
                error?: string;
              };

              if (data.step === 'pipeline_complete') {
                if (data.status === 'done') {
                  subscriber.next({ data, type: 'completed' });
                } else {
                  subscriber.next({ data, type: 'failed' });
                }
                subscriber.complete();
                break;
              }

              subscriber.next({ data });
            } catch {
              // skip malformed message
            }
          }

          if (!subscriber.closed) subscriber.complete();
        } catch (err) {
          if (!subscriber.closed) subscriber.error(err);
        } finally {
          if (heartbeat) clearInterval(heartbeat);
        }
      })();

      return () => {
        if (heartbeat) clearInterval(heartbeat);
        this.gateway.unsubscribe(channel).catch(() => {});
      };
    });
  }
}
