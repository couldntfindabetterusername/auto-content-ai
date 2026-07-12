import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { eq } from 'drizzle-orm';
import { contentCalendarJobs } from '../../db/schema';
import { JobsGateway } from './jobs.gateway';

@Injectable()
export class JobsService {
  constructor(
    @Inject('DB') private readonly db: any,
    private readonly gateway: JobsGateway,
  ) {}

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
              const data = JSON.parse(msg) as { step: string; progress: number; message: string };
              subscriber.next({ data });
              if (data.step === 'completed' || data.step === 'failed') {
                subscriber.complete();
                break;
              }
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
