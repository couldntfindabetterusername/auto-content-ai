import { Injectable } from '@nestjs/common';
import { Video } from './youtube.types';
import {
  ChannelMetrics,
  DurationBucket,
  DurationLabel,
  FormatGuess,
  KeywordFrequency,
  VideoSummary,
} from './metrics.types';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'can', 'i', 'my',
  'you', 'your', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these',
  'those', 'not', 'no', 'so', 'if', 'then', 'than', 'about', 'up', 'out',
  'what', 'when', 'where', 'who', 'why', 'how', 'all', 'any', 'both',
  'each', 'more', 'most', 'other', 'some', 'such', 'into', 'through',
]);

const FORMAT_PATTERNS: Array<{ format: string; pattern: RegExp }> = [
  { format: 'tutorial', pattern: /\btutorial\b/i },
  { format: 'review', pattern: /\breview\b/i },
  { format: 'how-to', pattern: /\bhow\s+to\b/i },
  { format: 'vs', pattern: /\bvs\.?\b/i },
  { format: 'top-list', pattern: /\btop\s+\d+\b/i },
  { format: 'explained', pattern: /\bexplained\b/i },
  { format: 'guide', pattern: /\bguide\b/i },
  { format: 'unboxing', pattern: /\bunboxing\b/i },
  { format: 'tips', pattern: /\btips\b/i },
  { format: 'best', pattern: /\bbest\b/i },
];

@Injectable()
export class MetricsService {
  compute(videos: Video[]): ChannelMetrics {
    if (videos.length === 0) {
      return this.emptyMetrics();
    }

    const byViewsDesc = [...videos].sort((a, b) => b.viewCount - a.viewCount);
    const views = videos.map((v) => v.viewCount);

    return {
      videoCount: videos.length,
      avgViews: this.average(views),
      medianViews: this.median(views),
      avgLikeRate: this.avgRate(videos, (v) => v.likeCount / (v.viewCount || 1)),
      avgCommentRate: this.avgRate(videos, (v) => v.commentCount / (v.viewCount || 1)),
      avgViewVelocity: this.avgViewVelocity(videos),
      durationBuckets: this.durationBuckets(videos),
      topVideos: byViewsDesc.slice(0, 5).map((v) => this.toSummary(v)),
      bottomVideos: byViewsDesc.slice(-5).reverse().map((v) => this.toSummary(v)),
      keywordFrequency: this.keywordFrequency(videos),
      uploadFrequencyDays: this.uploadFrequencyDays(videos),
      formatGuesses: this.formatGuesses(videos),
    };
  }

  private average(nums: number[]): number {
    if (nums.length === 0) return 0;
    return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
  }

  private median(nums: number[]): number {
    if (nums.length === 0) return 0;
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  private avgRate(videos: Video[], fn: (v: Video) => number): number {
    const sum = videos.reduce((s, v) => s + fn(v), 0);
    return parseFloat((sum / videos.length).toFixed(6));
  }

  private avgViewVelocity(videos: Video[]): number {
    const now = Date.now();
    const velocities = videos.map((v) => {
      const ageDays = (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      return ageDays > 0 ? v.viewCount / ageDays : v.viewCount;
    });
    return Math.round(this.average(velocities));
  }

  private durationBuckets(videos: Video[]): DurationBucket[] {
    const buckets: Record<DurationLabel, number[]> = { short: [], medium: [], long: [] };

    for (const v of videos) {
      const mins = v.durationSeconds / 60;
      if (mins < 5) buckets.short.push(v.viewCount);
      else if (mins <= 15) buckets.medium.push(v.viewCount);
      else buckets.long.push(v.viewCount);
    }

    return (['short', 'medium', 'long'] as const).map((label) => ({
      label,
      count: buckets[label].length,
      avgViews: this.average(buckets[label]),
    }));
  }

  private toSummary(v: Video): VideoSummary {
    return { id: v.id, title: v.title, viewCount: v.viewCount, publishedAt: v.publishedAt };
  }

  private keywordFrequency(videos: Video[]): KeywordFrequency[] {
    const freq = new Map<string, number>();

    for (const v of videos) {
      const words = v.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w));

      for (const word of words) {
        freq.set(word, (freq.get(word) ?? 0) + 1);
      }
    }

    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  private uploadFrequencyDays(videos: Video[]): number {
    if (videos.length < 2) return 0;

    const dates = videos
      .map((v) => new Date(v.publishedAt).getTime())
      .sort((a, b) => a - b);

    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }

    return parseFloat((gaps.reduce((s, g) => s + g, 0) / gaps.length).toFixed(1));
  }

  private formatGuesses(videos: Video[]): FormatGuess[] {
    const counts = new Map<string, number>();

    for (const v of videos) {
      for (const { format, pattern } of FORMAT_PATTERNS) {
        if (pattern.test(v.title)) {
          counts.set(format, (counts.get(format) ?? 0) + 1);
        }
      }
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([format, count]) => ({ format, count }));
  }

  private emptyMetrics(): ChannelMetrics {
    return {
      videoCount: 0,
      avgViews: 0,
      medianViews: 0,
      avgLikeRate: 0,
      avgCommentRate: 0,
      avgViewVelocity: 0,
      durationBuckets: [
        { label: 'short', count: 0, avgViews: 0 },
        { label: 'medium', count: 0, avgViews: 0 },
        { label: 'long', count: 0, avgViews: 0 },
      ],
      topVideos: [],
      bottomVideos: [],
      keywordFrequency: [],
      uploadFrequencyDays: 0,
      formatGuesses: [],
    };
  }
}
