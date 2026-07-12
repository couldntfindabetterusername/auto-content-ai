export interface CreateCalendarRequest {
  channelUrl: string;
  niche: string;
  preferences?: string;
}

export interface CreateCalendarResponse {
  jobId: string;
}

export interface TitleOption {
  id: string;
  video_concept_id: string;
  title: string;
  seo_score: string | null;
  ctr_score: string | null;
  rationale: string | null;
  is_recommended: boolean;
}

export interface SeoKeyword {
  id: string;
  video_concept_id: string;
  keyword: string;
  keyword_type: string | null;
  estimated_volume: string | null;
  competition: string | null;
  source: string | null;
}

export interface VideoConcept {
  id: string;
  calendar_id: string | null;
  position: number;
  topic: string;
  content_type: string | null;
  goal: string | null;
  recommended_title: string | null;
  hook: string | null;
  outline_json: unknown;
  retention_tactics: unknown;
  cta_json: unknown;
  seo_description: string | null;
  thumbnail_json: unknown;
  performance_prediction_json: unknown;
  confidence_score: string | null;
  evidence_json: unknown;
  titleOptions: TitleOption[];
  seoKeywords: SeoKeyword[];
}

export interface ChannelAnalysis {
  top_performing_patterns: Array<{ pattern: string; evidence: string[]; confidence: number }>;
  underperforming_patterns: Array<{ pattern: string; evidence: string[]; confidence: number }>;
  audience_inferences: string[];
  recommended_content_traits: {
    ideal_length_minutes: string;
    tone: string;
    formats: string[];
  };
  avoid: string[];
  summary: string;
}

export interface TrendCandidate {
  topic: string;
  trend_type: 'rising' | 'stable' | 'evergreen';
  source_signals: Array<{ source: string; evidence: string }>;
  competition: 'low' | 'medium' | 'high';
  channel_fit: 'low' | 'medium' | 'high';
  opportunity_score: number;
  rationale: string;
}

export interface TrendAnalysis {
  trend_candidates: TrendCandidate[];
}

export interface CalendarResponse {
  id: string;
  jobId: string;
  strategySummary: string | null;
  channelAnalysis: ChannelAnalysis | null;
  trendAnalysis: TrendAnalysis | null;
  topicSelectionRationale: string | null;
  qualityScore: string | null;
  createdAt: string;
  videoConcepts: VideoConcept[];
}
