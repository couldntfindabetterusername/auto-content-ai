import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  contentCalendars,
  contentCalendarJobs,
  videoConcepts,
  titleOptions,
  seoKeywords,
} from '../../db/schema';
import { OutlineGeneratorAgent } from '../agents/outline-generator.agent';
import { SeoOptimizerAgent } from '../agents/seo-optimizer.agent';
import { renderMarkdown } from '../export/markdown-renderer';
import type { ChannelAnalysis } from '../agents/schemas/channel-analysis.schema';
import type { TrendAnalysis } from '../agents/schemas/trend-analysis.schema';

export type RegenerateSection = 'titles' | 'hook' | 'outline' | 'seo' | 'thumbnail' | 'full_concept';

const VALID_SECTIONS: RegenerateSection[] = [
  'titles', 'hook', 'outline', 'seo', 'thumbnail', 'full_concept',
];

@Injectable()
export class RegenerationService {
  constructor(
    @Inject('DB') private readonly db: any,
    private readonly outlineAgent: OutlineGeneratorAgent,
    private readonly seoAgent: SeoOptimizerAgent,
  ) {}

  async regenerateSection(
    calendarId: string,
    userId: string,
    section: RegenerateSection,
    videoIndex: number,
  ): Promise<void> {
    if (!VALID_SECTIONS.includes(section)) {
      throw new BadRequestException(`Invalid section: ${section}`);
    }
    if (videoIndex < 0 || videoIndex > 3) {
      throw new BadRequestException('videoIndex must be 0-3');
    }

    const [row] = await this.db
      .select()
      .from(contentCalendars)
      .innerJoin(contentCalendarJobs, eq(contentCalendarJobs.id, contentCalendars.job_id))
      .where(eq(contentCalendars.id, calendarId))
      .limit(1);

    if (!row || row.content_calendar_jobs.user_id !== userId) {
      throw new NotFoundException('Calendar not found');
    }

    const calendar = row.content_calendars;
    const job = row.content_calendar_jobs;
    const channelAnalysis = calendar.channel_analysis as ChannelAnalysis | null;
    const trendAnalysis = calendar.trend_analysis as TrendAnalysis | null;

    if (!channelAnalysis) {
      throw new BadRequestException('Calendar has no channel analysis — pipeline may not have completed');
    }
    const niche: string = job.niche;
    const jobId: string = job.id;

    const position = videoIndex + 1;
    const [concept] = await this.db
      .select()
      .from(videoConcepts)
      .where(and(eq(videoConcepts.calendar_id, calendarId), eq(videoConcepts.position, position)))
      .limit(1);

    if (!concept) {
      throw new NotFoundException(`Video concept at index ${videoIndex} not found`);
    }

    if (section === 'full_concept') {
      await this.runOutline(concept, channelAnalysis, niche, jobId);
      const [refreshed] = await this.db
        .select()
        .from(videoConcepts)
        .where(eq(videoConcepts.id, concept.id as string))
        .limit(1);
      await this.runSeo(refreshed, channelAnalysis, niche, jobId, 'seo');
    } else if (section === 'hook' || section === 'outline') {
      await this.runOutline(concept, channelAnalysis, niche, jobId);
    } else {
      await this.runSeo(concept, channelAnalysis, niche, jobId, section);
    }

    await this.rerenderMarkdown(calendarId, channelAnalysis, trendAnalysis ?? { trend_candidates: [] });
  }

  private async runOutline(
    concept: any,
    channelAnalysis: ChannelAnalysis,
    niche: string,
    jobId: string,
  ): Promise<void> {
    const syntheticTopic = {
      topic: concept.topic as string,
      type: 'channel_fit' as const,
      why_now: 'User-requested regeneration',
      why_this_channel: channelAnalysis.summary,
      risk: 'low',
      differentiation_angle: 'Fresh take on existing topic',
    };

    const result = await this.outlineAgent.run(
      { topic: syntheticTopic, channelAnalysis, niche },
      jobId,
    );
    const vc = result.data.video_concept;

    await this.db
      .update(videoConcepts)
      .set({
        hook: vc.hook.script,
        outline_json: vc.outline,
        retention_tactics: vc.retention_hooks,
        cta_json: vc.cta,
      })
      .where(eq(videoConcepts.id, concept.id as string));
  }

  private async runSeo(
    concept: any,
    channelAnalysis: ChannelAnalysis,
    niche: string,
    jobId: string,
    section: 'titles' | 'seo' | 'thumbnail',
  ): Promise<void> {
    const syntheticConcept = {
      topic: concept.topic as string,
      target_audience: 'General audience',
      estimated_length_minutes: 10,
      hook: {
        timestamp: '0:00',
        script: (concept.hook as string) ?? '',
        visual_direction: '',
      },
      outline: (concept.outline_json as any[]) ?? [],
      retention_hooks: (concept.retention_tactics as any[]) ?? [],
      cta: (concept.cta_json as { primary: string; secondary: string }) ?? {
        primary: '',
        secondary: '',
      },
    };

    const result = await this.seoAgent.run(
      { videoConcept: syntheticConcept, channelAnalysis, niche },
      jobId,
    );
    const seo = result.data;
    const conceptId = concept.id as string;

    if (section === 'thumbnail') {
      await this.db
        .update(videoConcepts)
        .set({ thumbnail_json: seo.thumbnail })
        .where(eq(videoConcepts.id, conceptId));
      return;
    }

    const conceptUpdates: Record<string, unknown> = { recommended_title: seo.recommended_title };
    if (section === 'seo') {
      conceptUpdates.seo_description = seo.description;
      conceptUpdates.thumbnail_json = seo.thumbnail;
    }

    await this.db.transaction(async (tx: any) => {
      await tx.update(videoConcepts).set(conceptUpdates).where(eq(videoConcepts.id, conceptId));

      await tx.delete(titleOptions).where(eq(titleOptions.video_concept_id, conceptId));
      for (const opt of seo.titles) {
        await tx.insert(titleOptions).values({
          video_concept_id: conceptId,
          title: opt.title,
          seo_score: String(opt.seo_score),
          ctr_score: String(opt.ctr_score),
          rationale: opt.rationale,
          is_recommended: opt.title === seo.recommended_title,
        });
      }

      if (section === 'seo') {
        await tx.delete(seoKeywords).where(eq(seoKeywords.video_concept_id, conceptId));
        const keywords = [
          ...seo.primary_keywords.map((k: string) => ({ keyword: k, keyword_type: 'primary' })),
          ...seo.long_tail_keywords.map((k: string) => ({ keyword: k, keyword_type: 'long_tail' })),
          ...seo.tags.map((k: string) => ({ keyword: k, keyword_type: 'tag' })),
        ];
        for (const kw of keywords) {
          await tx.insert(seoKeywords).values({ video_concept_id: conceptId, ...kw });
        }
      }
    });
  }

  private async rerenderMarkdown(
    calendarId: string,
    channelAnalysis: ChannelAnalysis,
    trendAnalysis: TrendAnalysis,
  ): Promise<void> {
    const concepts = await this.db
      .select()
      .from(videoConcepts)
      .where(eq(videoConcepts.calendar_id, calendarId))
      .orderBy(videoConcepts.position);

    const videoConceptsList: any[] = [];
    const seoPackagesList: any[] = [];

    for (const concept of concepts) {
      const titles = await this.db
        .select()
        .from(titleOptions)
        .where(eq(titleOptions.video_concept_id, concept.id as string));

      const keywords = await this.db
        .select()
        .from(seoKeywords)
        .where(eq(seoKeywords.video_concept_id, concept.id as string));

      videoConceptsList.push({
        topic: concept.topic,
        target_audience: 'General audience',
        estimated_length_minutes: 10,
        hook: {
          timestamp: '0:00',
          script: (concept.hook as string) ?? '',
          visual_direction: '',
        },
        outline: (concept.outline_json as any[]) ?? [],
        retention_hooks: (concept.retention_tactics as any[]) ?? [],
        cta: (concept.cta_json as { primary: string; secondary: string }) ?? {
          primary: '',
          secondary: '',
        },
      });

      seoPackagesList.push({
        titles: titles.map((t: any) => ({
          title: t.title,
          seo_score: Number(t.seo_score ?? 0),
          ctr_score: Number(t.ctr_score ?? 0),
          rationale: t.rationale ?? '',
        })),
        recommended_title: (concept.recommended_title as string) ?? '',
        description: (concept.seo_description as string) ?? '',
        tags: keywords
          .filter((k: any) => k.keyword_type === 'tag')
          .map((k: any) => k.keyword as string),
        primary_keywords: keywords
          .filter((k: any) => k.keyword_type === 'primary')
          .map((k: any) => k.keyword as string),
        long_tail_keywords: keywords
          .filter((k: any) => k.keyword_type === 'long_tail')
          .map((k: any) => k.keyword as string),
        thumbnail: (concept.thumbnail_json as any) ?? {
          text_overlay: '',
          visual_elements: [],
          color_direction: '',
        },
        posting_recommendation: { day: 'Friday', confidence: 'low', basis: 'Regenerated — no historical data' },
      });
    }

    const syntheticTopicSelection = {
      selected_topics: concepts.map((c: any) => ({
        topic: c.topic as string,
        type: 'channel_fit' as const,
        why_now: '',
        why_this_channel: '',
        risk: '',
        differentiation_angle: '',
      })),
      rejected_topics: [] as any[],
    };

    const markdown = renderMarkdown({
      channelAnalysis,
      trendAnalysis,
      topicSelection: syntheticTopicSelection as any,
      videoConcepts: videoConceptsList as any,
      seoPackages: seoPackagesList as any,
    });

    await this.db
      .update(contentCalendars)
      .set({ final_markdown: markdown })
      .where(eq(contentCalendars.id, calendarId));
  }
}
