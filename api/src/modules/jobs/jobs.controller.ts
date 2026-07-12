import { Controller, Get, MessageEvent, Param, ParseUUIDPipe, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '../../auth/auth.guard';
import { JobsService } from './jobs.service';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get(':jobId/events')
  @Sse()
  @UseGuards(AuthGuard)
  async streamProgress(@Param('jobId', ParseUUIDPipe) jobId: string): Promise<Observable<MessageEvent>> {
    return this.jobsService.subscribeToJobProgress(jobId);
  }
}
