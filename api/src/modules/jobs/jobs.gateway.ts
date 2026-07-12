import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

@Injectable()
export class JobsGateway {
  private readonly subs = new Map<string, Redis>();

  constructor(@Inject('REDIS') private readonly redis: Redis) {}

  async subscribe(channel: string): Promise<AsyncIterable<string>> {
    const subscriber = this.redis.duplicate();

    this.subs.set(channel, subscriber);
    await subscriber.subscribe(channel);

    const queue: string[] = [];
    let notify: (() => void) | null = null;
    let closed = false;

    subscriber.on('message', (_: string, msg: string) => {
      queue.push(msg);
      if (notify) { notify(); notify = null; }
    });
    subscriber.on('end', () => { closed = true; if (notify) { notify(); notify = null; } });
    subscriber.on('error', () => { closed = true; if (notify) { notify(); notify = null; } });

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
    const subscriber = this.subs.get(channel);
    if (!subscriber) return;
    this.subs.delete(channel);
    try {
      await subscriber.unsubscribe(channel);
    } finally {
      subscriber.disconnect();
    }
  }
}
