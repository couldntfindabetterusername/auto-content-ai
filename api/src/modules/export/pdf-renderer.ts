import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { marked } from 'marked';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';

const CACHE_DIR = path.join(os.tmpdir(), 'autocontent-pdfs');
const TEMPLATE_PATH = path.join(__dirname, 'pdf-template.html');
const DANGEROUS_TAGS = /<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>|<(script|style|iframe|object|embed|form)[^>]*\/>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;
const JS_URLS = /\b(href|src)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi;

@Injectable()
export class PdfRenderer {
  private readonly logger = new Logger(PdfRenderer.name);
  private template: string | null = null;

  private getTemplate(): string {
    if (!this.template) {
      const raw = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
      if (!raw.includes('<!--CONTENT-->')) {
        throw new InternalServerErrorException('PDF template missing <!--CONTENT--> placeholder');
      }
      this.template = raw;
    }
    return this.template;
  }

  private cacheKey(calendarId: string, markdown: string): string {
    const hash = crypto.createHash('md5').update(markdown).digest('hex').slice(0, 10);
    return path.join(CACHE_DIR, `${calendarId}-${hash}.pdf`);
  }

  private readCache(cachePath: string): Buffer | null {
    try {
      if (fs.existsSync(cachePath)) {
        return fs.readFileSync(cachePath);
      }
    } catch {
      // cache miss — fall through
    }
    return null;
  }

  private writeCache(cachePath: string, data: Buffer): void {
    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cachePath, data);
    } catch (err) {
      this.logger.warn(`PDF cache write failed: ${(err as Error).message}`);
    }
  }

  private buildHtml(markdown: string): string {
    const processedMarkdown = markdown.replace(
      /(# Video Concept \d+)/g,
      '\n\n<div class="concept-card"></div>\n\n$1',
    );

    const rawHtml = marked.parse(processedMarkdown) as string;
    const content = rawHtml
      .replace(DANGEROUS_TAGS, '')
      .replace(EVENT_HANDLERS, '')
      .replace(JS_URLS, '');
    return this.getTemplate().replace('<!--CONTENT-->', content);
  }

  async render(calendarId: string, markdown: string): Promise<Buffer> {
    const cachePath = this.cacheKey(calendarId, markdown);
    const cached = this.readCache(cachePath);
    if (cached) {
      this.logger.debug(`PDF cache hit for ${calendarId}`);
      return cached;
    }

    this.logger.debug(`Generating PDF for ${calendarId}`);
    const html = this.buildHtml(markdown);

    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      try {
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: { top: '16mm', right: '16mm', bottom: '16mm', left: '16mm' },
          printBackground: true,
        });
        const buffer = Buffer.from(pdfBuffer);
        this.writeCache(cachePath, buffer);
        return buffer;
      } finally {
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }
}
