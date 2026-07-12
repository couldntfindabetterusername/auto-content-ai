export type TrendDirection = 'rising' | 'falling' | 'stable';

/** "ok" = live or cached data; "degraded" = upstream failed, results are empty. */
export type TrendConfidence = 'ok' | 'degraded';

export interface TrendSignal {
  query: string;
  /** Rising search interest as a percent. "Breakout" results are mapped to 5000. */
  risingPercent: number;
  relatedTopics: string[];
  trendDirection: TrendDirection;
}

export interface TrendsResult {
  signals: TrendSignal[];
  confidence: TrendConfidence;
}

export interface InterestResult {
  keyword: string;
  trendDirection: TrendDirection;
  confidence: TrendConfidence;
}
