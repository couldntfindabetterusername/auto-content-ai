import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { QueueService } from '../queue/queue.service';
import {
  contentCalendarJobs,
  contentCalendars,
  videoConcepts,
  titleOptions,
  seoKeywords,
} from '../db/schema';

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

  async getCalendar(calendarId: string, userId: string) {
    const [calendar] = await this.db
      .select()
      .from(contentCalendars)
      .innerJoin(contentCalendarJobs, eq(contentCalendarJobs.id, contentCalendars.job_id))
      .where(eq(contentCalendars.id, calendarId))
      .limit(1);

    if (!calendar || calendar.content_calendar_jobs.user_id !== userId) {
      throw new NotFoundException('Calendar not found');
    }

    const concepts = await this.db
      .select()
      .from(videoConcepts)
      .where(eq(videoConcepts.calendar_id, calendarId))
      .orderBy(videoConcepts.position);

    const conceptsWithDetails = await Promise.all(
      concepts.map(async (concept: typeof videoConcepts.$inferSelect) => {
        const titles = await this.db
          .select()
          .from(titleOptions)
          .where(eq(titleOptions.video_concept_id, concept.id));

        const keywords = await this.db
          .select()
          .from(seoKeywords)
          .where(eq(seoKeywords.video_concept_id, concept.id));

        return { ...concept, titleOptions: titles, seoKeywords: keywords };
      }),
    );

    return {
      id: calendar.content_calendars.id,
      jobId: calendar.content_calendars.job_id,
      strategySummary: calendar.content_calendars.strategy_summary,
      channelAnalysis: calendar.content_calendars.channel_analysis,
      trendAnalysis: calendar.content_calendars.trend_analysis,
      topicSelectionRationale: calendar.content_calendars.topic_selection_rationale,
      qualityScore: calendar.content_calendars.quality_score,
      createdAt: calendar.content_calendars.created_at,
      videoConcepts: conceptsWithDetails,
    };
  }

  async getCalendarMarkdown(calendarId: string, userId: string): Promise<string> {
    const [calendar] = await this.db
      .select({
        id: contentCalendars.id,
        final_markdown: contentCalendars.final_markdown,
        user_id: contentCalendarJobs.user_id,
      })
      .from(contentCalendars)
      .innerJoin(contentCalendarJobs, eq(contentCalendarJobs.id, contentCalendars.job_id))
      .where(eq(contentCalendars.id, calendarId))
      .limit(1);

    if (!calendar || calendar.user_id !== userId) {
      throw new NotFoundException('Calendar not found');
    }

    if (!calendar.final_markdown) {
      throw new NotFoundException('Markdown not yet available');
    }

    return calendar.final_markdown;
  }
}
