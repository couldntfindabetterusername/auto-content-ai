import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ContentCalendarService } from './content-calendar.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/content-calendars')
export class ContentCalendarController {
  constructor(private readonly contentCalendarService: ContentCalendarService) {}

  @Post('/')
  @UseGuards(AuthGuard)
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
}
