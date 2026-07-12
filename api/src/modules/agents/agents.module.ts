import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { DbModule } from '../../db/db.module';
import { AgentRunnerService } from './agent-runner.service';

@Module({
  imports: [LlmModule, DbModule],
  providers: [AgentRunnerService],
  exports: [AgentRunnerService],
})
export class AgentsModule {}
