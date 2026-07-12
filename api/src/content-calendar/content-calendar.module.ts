import { Module } from '@nestjs/common';
import { ContentCalendarController } from './content-calendar.controller';
import { ContentCalendarService } from './content-calendar.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [ContentCalendarController],
  providers: [ContentCalendarService],
})
export class ContentCalendarModule {}
