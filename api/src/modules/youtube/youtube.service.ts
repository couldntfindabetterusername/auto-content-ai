import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, youtube_v3 } from 'googleapis';
import Redis from 'ioredis';
import { parseChannelInput, ChannelNotFoundError } from './youtube.utils';

export interface Channel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  thumbnailUrl: string;
}

const CACHE_TTL_SECONDS = 24 * 60 * 60;

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
