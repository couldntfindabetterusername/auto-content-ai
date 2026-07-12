import { Module } from '@nestjs/common';
import { ContentCalendarController } from './content-calendar.controller';
import { ContentCalendarService } from './content-calendar.service';
import { QueueModule } from '../queue/queue.module';
import { QuotaModule } from '../modules/quota/quota.module';

@Module({
  imports: [QueueModule, QuotaModule],
  controllers: [ContentCalendarController],
  providers: [ContentCalendarService],
})
export class ContentCalendarModule {}
