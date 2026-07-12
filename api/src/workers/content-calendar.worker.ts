import 'dotenv/config';
import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { eq } from 'drizzle-orm';
import { createDb } from '../db/index';
import { contentCalendarJobs } from '../db/schema';
import { YoutubeService } from '../modules/youtube/youtube.service';
import { MetricsService } from '../modules/youtube/metrics.service';
import { InputValidator } from '../modules/agents/stages/input-validator';
import { ChannelDataCollector } from '../modules/agents/stages/channel-data-collector';

const db = createDb();

const publisher = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Minimal ConfigService shim — lets YoutubeService read from process.env
const envConfig = {
  getOrThrow: <T>(key: string): T => {
    const v = process.env[key];
    if (!v) throw new Error(`Missing env var: ${key}`);
    return v as unknown as T;
  },
  get: <T>(key: string, defaultVal?: T): T =>
    (process.env[key] as unknown as T) ?? defaultVal!,
};

const youtubeService = new YoutubeService(envConfig as any);
youtubeService.onModuleInit();

const metricsService = new MetricsService();
const inputValidator = new InputValidator();
const channelDataCollector = new ChannelDataCollector(youtubeService, metricsService);

async function publishProgress(
  jobId: string,
  step: string,
  status: 'running' | 'done' | 'failed',
  error?: string,
): Promise<void> {
  try {
    await publisher.publish(
      `job:${jobId}:progress`,
      JSON.stringify({
        jobId,
        agentName: step,
        status,
        agentRunId: '',
        timestamp: new Date().toISOString(),
        ...(error ? { error } : {}),
      }),
    );
  } catch {
    // non-fatal — never break execution for pub/sub failures
  }
}

const worker = new Worker(
  'content-calendar',
  async (job) => {
    const { jobId, channelUrl, niche, preferences } = job.data as {
      jobId: string;
      channelUrl: string;
      niche: string;
      preferences?: string;
    };

    // Stage 1: validate input
    await db
      .update(contentCalendarJobs)
      .set({ status: 'running', current_step: 'validating_input', started_at: new Date() })
      .where(eq(contentCalendarJobs.id, jobId));
    await publishProgress(jobId, 'validating_input', 'running');

    let validated;
    try {
      validated = inputValidator.validate({ channelUrl, niche, preferences });
      await publishProgress(jobId, 'validating_input', 'done');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(contentCalendarJobs)
        .set({ status: 'failed', error_message: message, completed_at: new Date() })
        .where(eq(contentCalendarJobs.id, jobId));
      await publishProgress(jobId, 'validating_input', 'failed', message);
      throw err;
    }

    // Stage 2: collect channel data
    await db
      .update(contentCalendarJobs)
      .set({ current_step: 'fetching_channel' })
      .where(eq(contentCalendarJobs.id, jobId));
    await publishProgress(jobId, 'fetching_channel', 'running');

    let channelData;
    try {
      channelData = await channelDataCollector.collect(validated.channelUrl);
      await db
        .update(contentCalendarJobs)
        .set({ channel_id: channelData.channel.id })
        .where(eq(contentCalendarJobs.id, jobId));
      await publishProgress(jobId, 'fetching_channel', 'done');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await db
        .update(contentCalendarJobs)
        .set({ status: 'failed', error_message: message, completed_at: new Date() })
        .where(eq(contentCalendarJobs.id, jobId));
      await publishProgress(jobId, 'fetching_channel', 'failed', message);
      throw err;
    }

    return { validated, channelData };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));

export default worker;
