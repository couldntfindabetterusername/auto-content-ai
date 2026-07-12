import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { parseChannelInput, ChannelNotFoundError } from './youtube.utils';
import { Video, SearchVideo } from './youtube.types';

export interface Channel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl: string;
}

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const VIDEO_CACHE_TTL_SECONDS = 6 * 60 * 60;
const SEARCH_CACHE_TTL_SECONDS = 12 * 60 * 60;
const SEARCH_MAX_RESULTS = 10;

function parseIsoDuration(iso: string): number {
  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

@Injectable()
export class YoutubeService implements OnModuleInit {
  private yt!: youtube_v3.Youtube;
  private redis!: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.yt = google.youtube({
      version: 'v3',
      auth: this.config.getOrThrow<string>('YOUTUBE_API_KEY'),
    });

    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
    });
  }

  async resolveChannel(input: string): Promise<Channel> {
    const parsed = parseChannelInput(input);

    if (parsed.type === 'id') {
      return this.fetchById(parsed.value, input);
    }

    if (parsed.type === 'handle') {
      return this.fetchByHandle(parsed.value, input);
    }

    if (parsed.type === 'username') {
      return this.fetchByUsername(parsed.value, input);
    }

    // customUrl — search is not in scope; use handle lookup as best effort
    return this.fetchByHandle(`@${parsed.value}`, input);
  }

  private async fetchById(channelId: string, originalInput: string): Promise<Channel> {
    const cacheKey = `yt:channel:${channelId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Channel;

    const res = await this.yt.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelId],
      maxResults: 1,
    });

    return this.extractChannel(res.data.items, cacheKey, originalInput);
  }

  private async fetchByHandle(handle: string, originalInput: string): Promise<Channel> {
    const res = await this.yt.channels.list({
      part: ['snippet', 'statistics'],
      forHandle: handle.startsWith('@') ? handle.slice(1) : handle,
      maxResults: 1,
    });

    const channel = await this.extractChannel(res.data.items, null, originalInput);
    const cacheKey = `yt:channel:${channel.id}`;
    await this.redis.set(cacheKey, JSON.stringify(channel), 'EX', CACHE_TTL_SECONDS);
    return channel;
  }

  private async fetchByUsername(username: string, originalInput: string): Promise<Channel> {
    const res = await this.yt.channels.list({
      part: ['snippet', 'statistics'],
      forUsername: username,
      maxResults: 1,
    });

    const channel = await this.extractChannel(res.data.items, null, originalInput);
    const cacheKey = `yt:channel:${channel.id}`;
    await this.redis.set(cacheKey, JSON.stringify(channel), 'EX', CACHE_TTL_SECONDS);
    return channel;
  }

  async getRecentVideos(channelId: string): Promise<Video[]> {
    const cacheKey = `yt:videos:${channelId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Video[];

    const searchRes = await this.yt.search.list({
      part: ['id'],
      channelId,
      type: ['video'],
      order: 'date',
      maxResults: 30,
    });

    const items = searchRes.data.items ?? [];
    if (items.length === 0) return [];

    const videoIds = items
      .map((i) => i.id?.videoId)
      .filter((id): id is string => Boolean(id));

    const videosRes = await this.yt.videos.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: videoIds,
    });

    const videos: Video[] = (videosRes.data.items ?? [])
      .map((item): Video | null => {
        if (!item.id || !item.snippet) return null;
        return {
          id: item.id,
          title: item.snippet.title ?? '',
          description: item.snippet.description ?? '',
          publishedAt: item.snippet.publishedAt ?? '',
          durationSeconds: parseIsoDuration(item.contentDetails?.duration ?? ''),
          viewCount: parseInt(item.statistics?.viewCount ?? '0', 10),
          likeCount: parseInt(item.statistics?.likeCount ?? '0', 10),
          commentCount: parseInt(item.statistics?.commentCount ?? '0', 10),
          tags: item.snippet.tags ?? [],
        };
      })
      .filter((v): v is Video => v !== null)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    await this.redis.set(cacheKey, JSON.stringify(videos), 'EX', VIDEO_CACHE_TTL_SECONDS);
    return videos;
  }

  async searchNicheTrends(niche: string): Promise<SearchVideo[]> {
    const query = niche.trim();
    if (query.length === 0) return [];

    const queryHash = createHash('sha256').update(query.toLowerCase()).digest('hex').slice(0, 16);
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `yt:search:${queryHash}:${today}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as SearchVideo[];

    const [byViews, byDate] = await Promise.all([
      this.searchVideoIds(query, 'viewCount'),
      this.searchVideoIds(query, 'date'),
    ]);

    // Merge both result sets, dropping duplicate video IDs.
    const videoIds = [...new Set([...byViews, ...byDate])];
    if (videoIds.length === 0) return [];

    const videosRes = await this.yt.videos.list({
      part: ['snippet', 'statistics'],
      id: videoIds,
    });

    const now = Date.now();
    const results: SearchVideo[] = (videosRes.data.items ?? [])
      .map((item): SearchVideo | null => {
        if (!item.id || !item.snippet) return null;
        const publishedAt = item.snippet.publishedAt ?? '';
        const viewCount = parseInt(item.statistics?.viewCount ?? '0', 10);
        const ageDays = Math.max(
          1,
          (now - new Date(publishedAt).getTime()) / (24 * 60 * 60 * 1000),
        );
        return {
          id: item.id,
          title: item.snippet.title ?? '',
          channelTitle: item.snippet.channelTitle ?? '',
          viewCount,
          publishedAt,
          viewVelocity: Math.round(viewCount / ageDays),
        };
      })
      .filter((v): v is SearchVideo => v !== null)
      .sort((a, b) => b.viewCount - a.viewCount);

    await this.redis.set(cacheKey, JSON.stringify(results), 'EX', SEARCH_CACHE_TTL_SECONDS);
    return results;
  }

  private async searchVideoIds(
    query: string,
    order: 'viewCount' | 'date',
  ): Promise<string[]> {
    const res = await this.yt.search.list({
      part: ['id'],
      q: query,
      type: ['video'],
      order,
      maxResults: SEARCH_MAX_RESULTS,
    });

    return (res.data.items ?? [])
      .map((i) => i.id?.videoId)
      .filter((id): id is string => Boolean(id));
  }

  private async extractChannel(
    items: youtube_v3.Schema$Channel[] | null | undefined,
    cacheKey: string | null,
    originalInput: string,
  ): Promise<Channel> {
    if (!items || items.length === 0) {
      throw new ChannelNotFoundError(originalInput);
    }

    const item = items[0];
    const snippet = item.snippet;
    const stats = item.statistics;

    if (!item.id || !snippet) {
      throw new ChannelNotFoundError(originalInput);
    }

    const channel: Channel = {
      id: item.id,
      title: snippet.title ?? '',
      description: snippet.description ?? '',
      subscriberCount: parseInt(stats?.subscriberCount ?? '0', 10),
      videoCount: parseInt(stats?.videoCount ?? '0', 10),
      thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? '',
    };

    if (cacheKey) {
      await this.redis.set(cacheKey, JSON.stringify(channel), 'EX', CACHE_TTL_SECONDS);
    }

    return channel;
  }
}
