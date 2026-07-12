import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class JobsGateway {
  private readonly subs = new Map<string, Redis>();

  async subscribe(channel: string): Promise<AsyncIterable<string>> {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.subs.set(channel, redis);
    await redis.subscribe(channel);

    const queue: string[] = [];
    let notify: (() => void) | null = null;
    let closed = false;

    redis.on('message', (_: string, msg: string) => {
      queue.push(msg);
      if (notify) { notify(); notify = null; }
    });
    redis.on('end', () => { closed = true; if (notify) { notify(); notify = null; } });
    redis.on('error', () => { closed = true; if (notify) { notify(); notify = null; } });

    return {
      [Symbol.asyncIterator]: async function* () {
        while (true) {
          if (queue.length > 0) {
            yield queue.shift()!;
          } else if (closed) {
            return;
          } else {
            await new Promise<void>(r => { notify = r; });
          }
        }
      },
    };
  }

  async unsubscribe(channel: string): Promise<void> {
    const redis = this.subs.get(channel);
    if (!redis) return;
    this.subs.delete(channel);
    try {
      await redis.unsubscribe(channel);
    } finally {
      redis.disconnect();
    }
  }
}
