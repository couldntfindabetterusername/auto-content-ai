import { YoutubeService, Channel } from '../../youtube/youtube.service';
import { MetricsService } from '../../youtube/metrics.service';
import { Video } from '../../youtube/youtube.types';
import { ChannelMetrics } from '../../youtube/metrics.types';

export interface ChannelData {
  channel: Channel;
  videos: Video[];
  metrics: ChannelMetrics;
}

export class ChannelDataCollector {
  constructor(
    private readonly youtube: YoutubeService,
    private readonly metrics: MetricsService,
  ) {}

  async collect(channelUrl: string): Promise<ChannelData> {
    const channel = await this.youtube.resolveChannel(channelUrl);
    const videos = await this.youtube.getRecentVideos(channel.id);
    const channelMetrics = this.metrics.compute(videos);
    return { channel, videos, metrics: channelMetrics };
  }
}
