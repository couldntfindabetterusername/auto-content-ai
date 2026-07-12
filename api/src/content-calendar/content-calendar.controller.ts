import { Body, Controller, Get, Header, HttpCode, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ContentCalendarService } from './content-calendar.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { RegenerateSectionDto } from './dto/regenerate-section.dto';
import { AuthGuard } from '../auth/auth.guard';
import { QuotaGuard } from '../modules/quota/quota.guard';
import { RegenerationService } from '../modules/content-calendar/regeneration.service';

@Controller('api/content-calendars')
export class ContentCalendarController {
  constructor(
    private readonly contentCalendarService: ContentCalendarService,
    private readonly regenerationService: RegenerationService,
  ) {}

  @Post('/')
  @UseGuards(AuthGuard, QuotaGuard)
  async createJob(@Body() dto: CreateCalendarDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.contentCalendarService.createJob(dto, user.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getCalendar(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.contentCalendarService.getCalendar(id, user.id);
  }

  @Get(':id/markdown')
  @UseGuards(AuthGuard)
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  async getMarkdown(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.contentCalendarService.getCalendarMarkdown(id, user.id);
  }

  @Post(':id/regenerate-section')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async regenerateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegenerateSectionDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string };
    await this.regenerationService.regenerateSection(id, user.id, dto.section, dto.videoIndex);
    return { success: true };
  }
}
