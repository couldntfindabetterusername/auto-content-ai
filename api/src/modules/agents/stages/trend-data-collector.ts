import { YoutubeService } from '../../youtube/youtube.service';
import { TrendsService } from '../../trends/trends.service';
import { SearchVideo } from '../../youtube/youtube.types';
import { TrendsResult } from '../../trends/trends.types';

export interface TrendData {
  youtubeSearch: SearchVideo[];
  googleTrends: TrendsResult;
}

export class TrendDataCollector {
  constructor(
    private readonly youtube: YoutubeService,
    private readonly trends: TrendsService,
  ) {}

  async collect(niche: string): Promise<TrendData> {
    const [youtubeResult, trendsResult] = await Promise.allSettled([
      this.youtube.searchNicheTrends(niche),
      this.trends.getRisingQueries(niche),
    ]);

    const youtubeSearch: SearchVideo[] =
      youtubeResult.status === 'fulfilled' ? youtubeResult.value : [];

    const googleTrends: TrendsResult =
      trendsResult.status === 'fulfilled'
        ? trendsResult.value
        : { signals: [], confidence: 'degraded' };

    return { youtubeSearch, googleTrends };
  }
}
