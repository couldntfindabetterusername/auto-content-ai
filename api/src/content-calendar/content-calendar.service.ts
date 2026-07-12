import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { QueueService } from '../queue/queue.service';
import { contentCalendarJobs } from '../db/schema';

const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(www\.)?(youtube\.com\/(channel\/|c\/|@)?|youtu\.be\/).+/;

@Injectable()
export class ContentCalendarService {
  constructor(
    @Inject('DB') private readonly db: any,
    private readonly queueService: QueueService,
  ) {}

  validateChannelUrl(url: string): void {
    if (!YOUTUBE_URL_PATTERN.test(url)) {
      throw new BadRequestException('Invalid YouTube channel URL');
    }
  }

  normalizeChannelUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;

      // /channel/UCxxxx → channel/UCxxxx
      if (path.startsWith('/channel/')) return path.slice(1);
      // /@handle or /c/handle → handle
      if (path.startsWith('/@')) return path.slice(2);
      if (path.startsWith('/c/')) return path.slice(3);

      return path.slice(1);
    } catch {
      return url;
    }
  }

  async createJob(dto: CreateCalendarDto, userId: string): Promise<{ jobId: string }> {
    this.validateChannelUrl(dto.channelUrl);

    const normalizedUrl = this.normalizeChannelUrl(dto.channelUrl);

    const [job] = await this.db
      .insert(contentCalendarJobs)
      .values({
        user_id: userId,
        channel_url: normalizedUrl,
        niche: dto.niche,
        preferences: dto.preferences ?? null,
        status: 'queued',
      })
      .returning({ id: contentCalendarJobs.id });

    await this.queueService.addJob({ jobId: job.id, userId, channelUrl: normalizedUrl, niche: dto.niche });

    return { jobId: job.id };
  }
}
