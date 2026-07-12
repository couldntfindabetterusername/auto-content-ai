import { Module } from '@nestjs/common';
import { ContentCalendarController } from './content-calendar.controller';
import { ContentCalendarService } from './content-calendar.service';
import { QueueModule } from '../queue/queue.module';
import { QuotaModule } from '../modules/quota/quota.module';
import { AgentsModule } from '../modules/agents/agents.module';
import { RegenerationService } from '../modules/content-calendar/regeneration.service';

@Module({
  imports: [QueueModule, QuotaModule, AgentsModule],
  controllers: [ContentCalendarController],
  providers: [ContentCalendarService, RegenerationService],
})
export class ContentCalendarModule {}
