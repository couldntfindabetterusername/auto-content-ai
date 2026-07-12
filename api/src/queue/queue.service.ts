import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { getRedisOptions } from '../shared/redis-config';

@Injectable()
export class QueueService {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('content-calendar', {
      connection: getRedisOptions(),
    });
  }

  async addJob(data: any) {
    return this.queue.add('generate-calendar', data);
  }
}
