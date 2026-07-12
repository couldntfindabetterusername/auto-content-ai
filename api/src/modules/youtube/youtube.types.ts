export interface Video {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

export interface SearchVideo {
  id: string;
  title: string;
  channelTitle: string;
  viewCount: number;
  publishedAt: string;
  /** Views per day since publish (>= 1 day floor). */
  viewVelocity: number;
}
