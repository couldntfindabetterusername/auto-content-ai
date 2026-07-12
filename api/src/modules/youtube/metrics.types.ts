export type DurationLabel = 'short' | 'medium' | 'long';

export interface DurationBucket {
  label: DurationLabel;
  count: number;
  avgViews: number;
}

export interface VideoSummary {
  id: string;
  title: string;
  viewCount: number;
  publishedAt: string;
}

export interface KeywordFrequency {
  word: string;
  count: number;
}

export interface FormatGuess {
  format: string;
  count: number;
}

export interface ChannelMetrics {
  videoCount: number;
  avgViews: number;
  medianViews: number;
  avgLikeRate: number;
  avgCommentRate: number;
  avgViewVelocity: number;
  durationBuckets: DurationBucket[];
  topVideos: VideoSummary[];
  bottomVideos: VideoSummary[];
  keywordFrequency: KeywordFrequency[];
  uploadFrequencyDays: number;
  formatGuesses: FormatGuess[];
}
