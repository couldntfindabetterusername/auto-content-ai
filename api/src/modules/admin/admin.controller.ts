import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('api/admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('jobs')
  async getJobs() {
    return this.adminService.getJobs();
  }

  @Get('jobs/:id/agent-runs')
  async getAgentRuns(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getJobAgentRuns(id);
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }
}
