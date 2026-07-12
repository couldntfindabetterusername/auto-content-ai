import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import { AdminService } from './admin.service';

@Controller('api/admin')
@UseGuards(AuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  private isAdmin(req: Request): boolean {
    const user = req.user as any;
    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    return adminEmails.map((e) => e.toLowerCase()).includes(user?.email?.toLowerCase());
  }

  @Get('jobs')
  async getJobs(@Req() req: Request) {
    if (!this.isAdmin(req)) throw new ForbiddenException();
    return this.adminService.getJobs();
  }

  @Get('jobs/:id/agent-runs')
  async getAgentRuns(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!this.isAdmin(req)) throw new ForbiddenException();
    return this.adminService.getJobAgentRuns(id);
  }

  @Get('stats')
  async getStats(@Req() req: Request) {
    if (!this.isAdmin(req)) throw new ForbiddenException();
    return this.adminService.getStats();
  }
}
