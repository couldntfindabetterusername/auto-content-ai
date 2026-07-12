import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { externalApiCalls } from '../../db/schema';
import {
  InterestResult,
  TrendDirection,
  TrendSignal,
  TrendsResult,
} from './trends.types';

// google-trends-api is an untyped CommonJS module; require() yields `any`
// without triggering module-resolution type errors.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleTrends = require('google-trends-api');

const CACHE_TTL_SECONDS = 24 * 60 * 60;
const DEFAULT_REGION = '';
const BREAKOUT_PERCENT = 5000;
const PROVIDER = 'google-trends';

interface RankedKeyword {
  query: string;
  value?: number;
  formattedValue?: string;
}

interface RankedList {
  rankedKeyword?: RankedKeyword[];
}

@Injectable()
export class TrendsService implements OnModuleInit {
  private redis!: Redis;

  constructor(
    private readonly config: ConfigService,
    @Inject('DB') private readonly db: any,
  ) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD', ''),
    });
  }

  /**
   * Fetch rising/related queries for a niche. Never throws: on upstream
   * failure (rate limit, network) returns empty signals with confidence
   * "degraded".
   */
  async getRisingQueries(niche: string, region = DEFAULT_REGION): Promise<TrendsResult> {
    const keyword = niche.trim();
    if (keyword.length === 0) {
      return { signals: [], confidence: 'ok' };
    }

    const nicheHash = createHash('sha256')
      .update(keyword.toLowerCase())
      .digest('hex')
      .slice(0, 16);
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `trends:${nicheHash}:${region || 'global'}:${today}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as TrendsResult;

    const start = Date.now();
    try {
      const [queriesRaw, topicsRaw] = await Promise.all([
        googleTrends.relatedQueries({ keyword, geo: region }),
        googleTrends.relatedTopics({ keyword, geo: region }),
      ]);

      // google-trends-api often resolves with an HTML rate-limit page instead
      // of throwing. Treat an unparseable body as a degraded upstream.
      const queries = parseJson(queriesRaw);
      if (queries === null) {
        await this.logCall('relatedQueries', keyword, cacheKey, 429, Date.now() - start);
        return { signals: [], confidence: 'degraded' };
      }

      const relatedTopics = this.extractRising(parseJson(topicsRaw)).map((k) => k.query);
      const signals: TrendSignal[] = this.extractRising(queries).map(
        (k): TrendSignal => ({
          query: k.query,
          risingPercent: this.toRisingPercent(k),
          relatedTopics,
          trendDirection: 'rising',
        }),
      );

      const result: TrendsResult = { signals, confidence: 'ok' };
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
      await this.logCall('relatedQueries', keyword, cacheKey, 200, Date.now() - start);
      return result;
    } catch {
      await this.logCall('relatedQueries', keyword, cacheKey, 0, Date.now() - start);
      return { signals: [], confidence: 'degraded' };
    }
  }

  /**
   * Determine the search-interest direction for a keyword by comparing the
   * first and last data points of the interest-over-time series.
   */
  async getInterestOverTime(keyword: string, region = DEFAULT_REGION): Promise<InterestResult> {
    const term = keyword.trim();
    if (term.length === 0) {
      return { keyword: term, trendDirection: 'stable', confidence: 'ok' };
    }

    const start = Date.now();
    try {
      const raw = await googleTrends.interestOverTime({ keyword: term, geo: region });
      const parsed = parseJson(raw);
      if (parsed === null) {
        await this.logCall('interestOverTime', term, null, 429, Date.now() - start);
        return { keyword: term, trendDirection: 'stable', confidence: 'degraded' };
      }
      const trendDirection = this.directionFromTimeline(parsed);
      await this.logCall('interestOverTime', term, null, 200, Date.now() - start);
      return { keyword: term, trendDirection, confidence: 'ok' };
    } catch {
      await this.logCall('interestOverTime', term, null, 0, Date.now() - start);
      return { keyword: term, trendDirection: 'stable', confidence: 'degraded' };
    }
  }

  /** Pull the "rising" ranked list out of a parsed relatedQueries/relatedTopics body. */
  private extractRising(parsed: any): RankedKeyword[] {
    const lists: RankedList[] = parsed?.default?.rankedList ?? [];
    // rankedList[0] = top, rankedList[1] = rising.
    const rising = lists[1]?.rankedKeyword ?? lists[0]?.rankedKeyword ?? [];
    return rising
      .filter((k) => Boolean(k?.query))
      .map((k) => ({
        query: k.query ?? '',
        value: k.value,
        formattedValue: k.formattedValue,
      }));
  }

  private toRisingPercent(k: RankedKeyword): number {
    if (typeof k.value === 'number' && k.value > 0) return k.value;
    if (k.formattedValue && /breakout/i.test(k.formattedValue)) return BREAKOUT_PERCENT;
    const parsed = parseInt((k.formattedValue ?? '').replace(/[^0-9]/g, ''), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private directionFromTimeline(parsed: any): TrendDirection {
    const timeline: Array<{ value?: number[] }> = parsed?.default?.timelineData ?? [];
    const values = timeline
      .map((point) => point.value?.[0])
      .filter((v): v is number => typeof v === 'number');
    if (values.length < 2) return 'stable';

    // Compare the mean of the first and last thirds to smooth out noise.
    const third = Math.max(1, Math.floor(values.length / 3));
    const head = mean(values.slice(0, third));
    const tail = mean(values.slice(-third));
    const delta = tail - head;
    if (delta > 5) return 'rising';
    if (delta < -5) return 'falling';
    return 'stable';
  }

  private async logCall(
    endpoint: string,
    keyword: string,
    cacheKey: string | null,
    statusCode: number,
    latencyMs: number,
  ): Promise<void> {
    const requestHash = createHash('sha256')
      .update(`${endpoint}:${keyword.toLowerCase()}`)
      .digest('hex')
      .slice(0, 32);
    try {
      await this.db.insert(externalApiCalls).values({
        provider: PROVIDER,
        endpoint,
        request_hash: requestHash,
        response_cache_key: cacheKey,
        status_code: statusCode,
        latency_ms: latencyMs,
      });
    } catch {
      // Logging must never break the caller.
    }
  }
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Parse a google-trends-api body, returning null for HTML error pages. */
function parseJson(raw: unknown): any | null {
  if (typeof raw !== 'string' || raw.trim().startsWith('<')) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
