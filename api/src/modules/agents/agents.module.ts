import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { DbModule } from '../../db/db.module';
import { AgentRunnerService } from './agent-runner.service';
import { ChannelAnalyzerAgent } from './channel-analyzer.agent';
import { TrendScoutAgent } from './trend-scout.agent';

@Module({
  imports: [LlmModule, DbModule],
  providers: [AgentRunnerService, ChannelAnalyzerAgent, TrendScoutAgent],
  exports: [AgentRunnerService, ChannelAnalyzerAgent, TrendScoutAgent],
})
export class AgentsModule {}
