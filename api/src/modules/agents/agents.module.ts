import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { DbModule } from '../../db/db.module';
import { AgentRunnerService } from './agent-runner.service';
import { ChannelAnalyzerAgent } from './channel-analyzer.agent';
import { TrendScoutAgent } from './trend-scout.agent';
import { TopicStrategistAgent } from './topic-strategist.agent';
import { OutlineGeneratorAgent } from './outline-generator.agent';
import { SeoOptimizerAgent } from './seo-optimizer.agent';
import { FinalQaAgent } from './final-qa.agent';

@Module({
  imports: [LlmModule, DbModule],
  providers: [AgentRunnerService, ChannelAnalyzerAgent, TrendScoutAgent, TopicStrategistAgent, OutlineGeneratorAgent, SeoOptimizerAgent, FinalQaAgent],
  exports: [AgentRunnerService, ChannelAnalyzerAgent, TrendScoutAgent, TopicStrategistAgent, OutlineGeneratorAgent, SeoOptimizerAgent, FinalQaAgent],
})
export class AgentsModule {}
