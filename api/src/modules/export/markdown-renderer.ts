import type { ChannelAnalysis } from '../agents/schemas/channel-analysis.schema';
import type { TrendAnalysis } from '../agents/schemas/trend-analysis.schema';
import type { TopicSelection, SelectedTopic } from '../agents/schemas/topic-selection.schema';
import type { VideoConcept } from '../agents/schemas/outline.schema';
import type { SeoPackage } from '../agents/schemas/seo-package.schema';

export interface MarkdownRendererInput {
  channelAnalysis: ChannelAnalysis;
  trendAnalysis: TrendAnalysis;
  topicSelection: TopicSelection;
  videoConcepts: VideoConcept[];
  seoPackages: SeoPackage[];
}

const GOAL_LABELS: Record<string, string> = {
  viral_trending: 'Viral / Trending',
  evergreen_seo: 'Evergreen SEO',
  channel_fit: 'Channel Fit',
  experimental_growth: 'Experimental Growth',
};

function renderStrategySummary(input: MarkdownRendererInput): string {
  const { channelAnalysis, topicSelection } = input;
  return [
    '## 1. Strategy Summary',
    '',
    channelAnalysis.summary,
    '',
    '**Topic Selection Rationale:**',
    '',
    ...topicSelection.selected_topics.map(
      (t) => `- **${t.topic}**: ${t.why_now}. ${t.why_this_channel}`,
    ),
  ].join('\n');
}

function renderChannelAnalysis(analysis: ChannelAnalysis): string {
  return [
    '## 2. Channel Performance Analysis',
    '',
    '### Top Performing Patterns',
    '',
    ...analysis.top_performing_patterns.map(
      (p) =>
        `- **${p.pattern}** (confidence: ${Math.round(p.confidence * 100)}%)\n  ${p.evidence.join(', ')}`,
    ),
    '',
    '### Underperforming Patterns',
    '',
    ...analysis.underperforming_patterns.map(
      (p) => `- **${p.pattern}**\n  ${p.evidence.join(', ')}`,
    ),
    '',
    '### Audience Inferences',
    '',
    ...analysis.audience_inferences.map((a) => `- ${a}`),
    '',
    '### Recommended Content Traits',
    '',
    `- **Ideal Length:** ${analysis.recommended_content_traits.ideal_length_minutes}`,
    `- **Tone:** ${analysis.recommended_content_traits.tone}`,
    `- **Formats:** ${analysis.recommended_content_traits.formats.join(', ')}`,
    '',
    '### Avoid',
    '',
    ...analysis.avoid.map((a) => `- ${a}`),
  ].join('\n');
}

function renderTrendResearch(trendAnalysis: TrendAnalysis): string {
  const candidateSections = trendAnalysis.trend_candidates
    .map((tc) =>
      [
        `### ${tc.topic}`,
        '',
        `- **Type:** ${tc.trend_type}`,
        `- **Competition:** ${tc.competition}`,
        `- **Channel Fit:** ${tc.channel_fit}`,
        `- **Opportunity Score:** ${tc.opportunity_score}/10`,
        `- **Rationale:** ${tc.rationale}`,
        `- **Signals:** ${tc.source_signals.map((s) => `${s.source}: ${s.evidence}`).join('; ')}`,
        '',
      ].join('\n'),
    )
    .join('\n\n');

  return ['## 3. Trend Research Summary', '', candidateSections].join('\n');
}

function renderContentMixTable(input: MarkdownRendererInput): string {
  const { topicSelection, seoPackages } = input;
  const rows = topicSelection.selected_topics.map((topic, i) => {
    const confidence = seoPackages[i]?.posting_recommendation.confidence ?? 'N/A';
    const goal = GOAL_LABELS[topic.type] ?? topic.type;
    return `| Video ${i + 1} | ${goal} | ${topic.topic} | ${topic.type} | ${confidence} |`;
  });

  return [
    '## 4. Selected Content Mix',
    '',
    '| Video | Goal | Topic | Content Type | Confidence |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n');
}

function renderVideoConcept(
  index: number,
  concept: VideoConcept,
  seo: SeoPackage,
  selectedTopic: SelectedTopic,
): string {
  const num = index + 1;

  const outlineSections = concept.outline
    .map((s) => {
      const parts = [
        `**${s.timestamp} — ${s.section}**`,
        '',
        s.talking_points.map((tp) => `- ${tp}`).join('\n'),
      ];
      if (s.visuals.length > 0) parts.push('', `*Visuals: ${s.visuals.join(', ')}*`);
      if (s.retention_purpose) parts.push('', `*Retention: ${s.retention_purpose}*`);
      return parts.join('\n');
    })
    .join('\n\n');

  const retentionHooks = concept.retention_hooks
    .map((h) => `- **${h.timestamp}:** "${h.line}" — ${h.reason}`)
    .join('\n');

  const titleOptionsTable = [
    '| Title | SEO Score | CTR Score | Rationale |',
    '|---|---|---|---|',
    ...seo.titles.map(
      (t) => `| ${t.title} | ${t.seo_score}/10 | ${t.ctr_score}/10 | ${t.rationale} |`,
    ),
  ].join('\n');

  return [
    `# Video Concept ${num}`,
    '',
    '## Recommended Title',
    '',
    seo.recommended_title,
    '',
    '## Title Options',
    '',
    titleOptionsTable,
    '',
    '## Why This Video',
    '',
    `**Why Now:** ${selectedTopic.why_now}`,
    '',
    `**Why This Channel:** ${selectedTopic.why_this_channel}`,
    '',
    `**Differentiation:** ${selectedTopic.differentiation_angle}`,
    '',
    `**Risk:** ${selectedTopic.risk}`,
    '',
    '## Hook',
    '',
    `**Timestamp:** ${concept.hook.timestamp}`,
    '',
    concept.hook.script,
    '',
    `*Visual Direction: ${concept.hook.visual_direction}*`,
    '',
    '## Detailed Outline',
    '',
    `*Target Audience: ${concept.target_audience} | Estimated Length: ${concept.estimated_length_minutes} min*`,
    '',
    outlineSections,
    '',
    '## Retention Tactics',
    '',
    retentionHooks,
    '',
    '## Call to Action',
    '',
    `**Primary:** ${concept.cta.primary}`,
    '',
    `**Secondary:** ${concept.cta.secondary}`,
    '',
    '## SEO Package',
    '',
    '**Description:**',
    '',
    seo.description,
    '',
    `**Primary Keywords:** ${seo.primary_keywords.join(', ')}`,
    `**Long-tail Keywords:** ${seo.long_tail_keywords.join(', ')}`,
    `**Tags:** ${seo.tags.join(', ')}`,
    '',
    '## Thumbnail Direction',
    '',
    `**Text Overlay:** ${seo.thumbnail.text_overlay}`,
    '',
    `**Visual Elements:** ${seo.thumbnail.visual_elements.join(', ')}`,
    '',
    `**Color Direction:** ${seo.thumbnail.color_direction}`,
    '',
    '## Performance Potential',
    '',
    `**Best Posting Day:** ${seo.posting_recommendation.day}`,
    '',
    `**Confidence:** ${seo.posting_recommendation.confidence}`,
    '',
    `**Basis:** ${seo.posting_recommendation.basis}`,
    '',
    '---',
  ].join('\n');
}

export function renderMarkdown(input: MarkdownRendererInput): string {
  const { channelAnalysis, trendAnalysis, topicSelection, videoConcepts, seoPackages } = input;

  const sections: string[] = [
    '# YouTube Content Calendar',
    '',
    renderStrategySummary(input),
    '',
    renderChannelAnalysis(channelAnalysis),
    '',
    renderTrendResearch(trendAnalysis),
    '',
    renderContentMixTable(input),
    '',
    '---',
    '',
  ];

  for (let i = 0; i < videoConcepts.length; i++) {
    const concept = videoConcepts[i];
    const seo = seoPackages[i];
    const topic = topicSelection.selected_topics[i];
    if (concept && seo && topic) {
      sections.push(renderVideoConcept(i, concept, seo, topic));
      sections.push('');
    } else {
      console.warn(`[markdown-renderer] skipping video concept ${i + 1}: missing concept=${!concept} seo=${!seo} topic=${!topic}`);
    }
  }

  return sections.join('\n').trim();
}
