import { Body, Controller, Get, Header, HttpCode, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ContentCalendarService } from './content-calendar.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { RegenerateSectionDto } from './dto/regenerate-section.dto';
import { AuthGuard } from '../auth/auth.guard';
import { QuotaGuard } from '../modules/quota/quota.guard';
import { RegenerationService } from '../modules/content-calendar/regeneration.service';
import { PdfRenderer } from '../modules/export/pdf-renderer';

@Controller('api/content-calendars')
export class ContentCalendarController {
  constructor(
    private readonly contentCalendarService: ContentCalendarService,
    private readonly regenerationService: RegenerationService,
    private readonly pdfRenderer: PdfRenderer,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard)
  async listCalendars(
    @Req() req: Request,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const user = req.user as { id: string };
    const parsedPage = parseInt(page, 10);
    const parsedSize = parseInt(pageSize, 10);
    return this.contentCalendarService.listCalendars(
      user.id,
      Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1,
      Number.isFinite(parsedSize) ? Math.min(100, Math.max(1, parsedSize)) : 20,
    );
  }

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

  @Get(':id/pdf')
  @UseGuards(AuthGuard)
  async getCalendarPdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user as { id: string };
    const markdown = await this.contentCalendarService.getCalendarMarkdown(id, user.id);
    try {
      const pdfBuffer = await this.pdfRenderer.render(id, markdown);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="autocontent-${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (err) {
      res.status(500).json({ message: 'PDF generation failed', error: (err as Error).message });
    }
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
