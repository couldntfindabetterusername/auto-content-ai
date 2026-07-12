import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { DbModule } from '../../db/db.module';
import { AgentRunnerService } from './agent-runner.service';
import { ChannelAnalyzerAgent } from './channel-analyzer.agent';
import { TrendScoutAgent } from './trend-scout.agent';
import { TopicStrategistAgent } from './topic-strategist.agent';
import { OutlineGeneratorAgent } from './outline-generator.agent';

@Module({
  imports: [LlmModule, DbModule],
  providers: [AgentRunnerService, ChannelAnalyzerAgent, TrendScoutAgent, TopicStrategistAgent, OutlineGeneratorAgent],
  exports: [AgentRunnerService, ChannelAnalyzerAgent, TrendScoutAgent, TopicStrategistAgent, OutlineGeneratorAgent],
})
export class AgentsModule {}
