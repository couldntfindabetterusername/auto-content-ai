import {
  contentCalendars,
  videoConcepts as videoConceptsTable,
  titleOptions as titleOptionsTable,
  seoKeywords as seoKeywordsTable,
} from '../../db/schema';
import type { ChannelAnalysis } from '../agents/schemas/channel-analysis.schema';
import type { TrendAnalysis } from '../agents/schemas/trend-analysis.schema';
import type { TopicSelection } from '../agents/schemas/topic-selection.schema';
import type { VideoConcept } from '../agents/schemas/outline.schema';
import type { SeoPackage } from '../agents/schemas/seo-package.schema';
import type { QaResult } from '../agents/schemas/qa-result.schema';
import { renderMarkdown } from '../export/markdown-renderer';

export interface SaveResultsInput {
  jobId: string;
  channelAnalysis: ChannelAnalysis;
  trendAnalysis: TrendAnalysis;
  topicSelection: TopicSelection;
  videoConcepts: VideoConcept[];
  seoPackages: SeoPackage[];
  qaResult?: QaResult;
}

export class CalendarPersistenceService {
  constructor(private readonly db: any) {}

  async saveResults(input: SaveResultsInput): Promise<string> {
    const rationale = input.topicSelection.selected_topics
      .map((t) => `${t.topic}: ${t.why_now}`)
      .join('\n');

    const finalMarkdown = renderMarkdown({
      channelAnalysis: input.channelAnalysis,
      trendAnalysis: input.trendAnalysis,
      topicSelection: input.topicSelection,
      videoConcepts: input.videoConcepts,
      seoPackages: input.seoPackages,
    });

    return await this.db.transaction(async (tx: any) => {
      const [calendarRow] = await tx
        .insert(contentCalendars)
        .values({
          job_id: input.jobId,
          strategy_summary: input.channelAnalysis.summary,
          channel_analysis: input.channelAnalysis,
          trend_analysis: input.trendAnalysis,
          topic_selection_rationale: rationale,
          final_markdown: finalMarkdown,
          quality_score: input.qaResult != null ? String(input.qaResult.quality_score) : null,
        })
        .returning({ id: contentCalendars.id });

      const calendarId: string = calendarRow.id;

      for (let i = 0; i < input.videoConcepts.length; i++) {
        const concept = input.videoConcepts[i];
        const seo = input.seoPackages[i];

        const [conceptRow] = await tx
          .insert(videoConceptsTable)
          .values({
            calendar_id: calendarId,
            position: i + 1,
            topic: concept.topic,
            recommended_title: seo?.recommended_title ?? null,
            hook: concept.hook.script,
            outline_json: concept.outline,
            retention_tactics: concept.retention_hooks,
            cta_json: concept.cta,
            seo_description: seo?.description ?? null,
            thumbnail_json: seo?.thumbnail ?? null,
          })
          .returning({ id: videoConceptsTable.id });

        const conceptId: string = conceptRow.id;

        if (seo) {
          if (seo.titles.length > 0) {
            await tx.insert(titleOptionsTable).values(
              seo.titles.map((opt) => ({
                video_concept_id: conceptId,
                title: opt.title,
                seo_score: String(opt.seo_score),
                ctr_score: String(opt.ctr_score),
                rationale: opt.rationale,
                is_recommended: opt.title === seo.recommended_title,
              })),
            );
          }

          const keywords = [
            ...seo.primary_keywords.map((k) => ({ keyword: k, keyword_type: 'primary' as const })),
            ...seo.long_tail_keywords.map((k) => ({ keyword: k, keyword_type: 'long_tail' as const })),
            ...seo.tags.map((k) => ({ keyword: k, keyword_type: 'tag' as const })),
          ];

          if (keywords.length > 0) {
            await tx.insert(seoKeywordsTable).values(
              keywords.map((kw) => ({
                video_concept_id: conceptId,
                keyword: kw.keyword,
                keyword_type: kw.keyword_type,
              })),
            );
          }
        }
      }

      return calendarId;
    });
  }
}
