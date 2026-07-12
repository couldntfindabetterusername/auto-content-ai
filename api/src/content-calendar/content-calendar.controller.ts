import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ContentCalendarService } from './content-calendar.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('content-calendars')
export class ContentCalendarController {
  constructor(private readonly contentCalendarService: ContentCalendarService) {}

  @Post('/')
  @UseGuards(AuthGuard)
  async createJob(@Body() dto: CreateCalendarDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.contentCalendarService.createJob(dto, user.id);
  }
}
