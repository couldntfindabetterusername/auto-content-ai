import { Controller, Get, MessageEvent, Param, ParseUUIDPipe, Req, Sse, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { AuthGuard } from '../../auth/auth.guard';
import { JobsService } from './jobs.service';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':jobId')
  @UseGuards(AuthGuard)
  async getJob(@Param('jobId', ParseUUIDPipe) jobId: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.jobsService.getJobStatus(jobId, user.id);
  }

  @Get(':jobId/events')
  @Sse()
  @UseGuards(AuthGuard)
  async streamProgress(@Param('jobId', ParseUUIDPipe) jobId: string): Promise<Observable<MessageEvent>> {
    return this.jobsService.subscribeToJobProgress(jobId);
  }
}
