import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { RateCalendarDto } from './dto/rate-calendar.dto';
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

    if (concepts.length === 0) {
      return {
        id: calendar.content_calendars.id,
        jobId: calendar.content_calendars.job_id,
        strategySummary: calendar.content_calendars.strategy_summary,
        channelAnalysis: calendar.content_calendars.channel_analysis,
        trendAnalysis: calendar.content_calendars.trend_analysis,
        topicSelectionRationale: calendar.content_calendars.topic_selection_rationale,
        qualityScore: calendar.content_calendars.quality_score,
        userRating: calendar.content_calendars.user_rating,
        userFeedback: calendar.content_calendars.user_feedback,
        createdAt: calendar.content_calendars.created_at,
        videoConcepts: [],
      };
    }

    const conceptIds = concepts.map((c: typeof videoConcepts.$inferSelect) => c.id);

    const allTitles = await this.db
      .select()
      .from(titleOptions)
      .where(inArray(titleOptions.video_concept_id, conceptIds));

    const allKeywords = await this.db
      .select()
      .from(seoKeywords)
      .where(inArray(seoKeywords.video_concept_id, conceptIds));

    const titlesByConceptId = new Map<string, typeof titleOptions.$inferSelect[]>();
    for (const t of allTitles) {
      const arr = titlesByConceptId.get(t.video_concept_id) ?? [];
      arr.push(t);
      titlesByConceptId.set(t.video_concept_id, arr);
    }

    const keywordsByConceptId = new Map<string, typeof seoKeywords.$inferSelect[]>();
    for (const k of allKeywords) {
      const arr = keywordsByConceptId.get(k.video_concept_id) ?? [];
      arr.push(k);
      keywordsByConceptId.set(k.video_concept_id, arr);
    }

    const conceptsWithDetails = concepts.map((concept: typeof videoConcepts.$inferSelect) => ({
      ...concept,
      titleOptions: titlesByConceptId.get(concept.id) ?? [],
      seoKeywords: keywordsByConceptId.get(concept.id) ?? [],
    }));

    return {
      id: calendar.content_calendars.id,
      jobId: calendar.content_calendars.job_id,
      strategySummary: calendar.content_calendars.strategy_summary,
      channelAnalysis: calendar.content_calendars.channel_analysis,
      trendAnalysis: calendar.content_calendars.trend_analysis,
      topicSelectionRationale: calendar.content_calendars.topic_selection_rationale,
      qualityScore: calendar.content_calendars.quality_score,
      userRating: calendar.content_calendars.user_rating,
      userFeedback: calendar.content_calendars.user_feedback,
      createdAt: calendar.content_calendars.created_at,
      videoConcepts: conceptsWithDetails,
    };
  }

  async listCalendars(userId: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const rows = await this.db
      .select({
        id: contentCalendarJobs.id,
        channelUrl: contentCalendarJobs.channel_url,
        niche: contentCalendarJobs.niche,
        status: contentCalendarJobs.status,
        progressPercent: contentCalendarJobs.progress_percent,
        createdAt: contentCalendarJobs.created_at,
        calendarId: contentCalendars.id,
        qaScore: contentCalendars.quality_score,
        total: sql<number>`count(*) OVER()::int`,
      })
      .from(contentCalendarJobs)
      .leftJoin(contentCalendars, eq(contentCalendars.job_id, contentCalendarJobs.id))
      .where(eq(contentCalendarJobs.user_id, userId))
      .orderBy(desc(contentCalendarJobs.created_at))
      .limit(pageSize)
      .offset(offset);

    return {
      items: rows.map((r: any) => ({
        id: r.id,
        calendarId: r.calendarId,
        channelUrl: r.channelUrl,
        niche: r.niche,
        status: r.status,
        progressPercent: r.progressPercent,
        createdAt: r.createdAt,
        qaScore: r.qaScore,
      })),
      total: rows[0]?.total ?? await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentCalendarJobs)
        .where(eq(contentCalendarJobs.user_id, userId))
        .then(([r]: any[]) => r?.count ?? 0),
      page,
      pageSize,
    };
  }

  async rateCalendar(calendarId: string, userId: string, dto: RateCalendarDto): Promise<void> {
    const [calendar] = await this.db
      .select({ id: contentCalendars.id, user_id: contentCalendarJobs.user_id })
      .from(contentCalendars)
      .innerJoin(contentCalendarJobs, eq(contentCalendarJobs.id, contentCalendars.job_id))
      .where(eq(contentCalendars.id, calendarId))
      .limit(1);

    if (!calendar || calendar.user_id !== userId) {
      throw new NotFoundException('Calendar not found');
    }

    await this.db
      .update(contentCalendars)
      .set({ user_rating: dto.rating, user_feedback: dto.feedback ?? null })
      .where(eq(contentCalendars.id, calendarId));
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
