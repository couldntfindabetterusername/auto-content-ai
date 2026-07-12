import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('content-calendar', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }

  async addJob(data: any) {
    return this.queue.add('generate-calendar', data);
  }
}
