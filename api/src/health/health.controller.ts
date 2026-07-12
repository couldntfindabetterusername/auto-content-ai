import { Controller, Get, Post } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Controller()
export class HealthController {
  constructor(private readonly queueService: QueueService) {}

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }

  @Post('api/test-queue')
  async testQueue() {
    const job = await this.queueService.addJob({ test: true });
    return { jobId: job.id };
  }
}
