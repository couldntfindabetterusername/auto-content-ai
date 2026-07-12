import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface PromptResult {
  template: string;
  version: string;
}

@Injectable()
export class PromptLoader {
  private readonly promptsDir: string;

  constructor(promptsDir?: string) {
    this.promptsDir = promptsDir ?? path.resolve(process.cwd(), 'prompts');
  }

  load(agentName: string, version?: string): PromptResult {
    const resolvedVersion = version ?? this.findLatestVersion(agentName);
    const filename = `${agentName}_${resolvedVersion}.md`;
    const filePath = path.join(this.promptsDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Prompt not found: ${agentName} version ${resolvedVersion}`);
    }

    const template = fs.readFileSync(filePath, 'utf-8');
    return { template, version: resolvedVersion };
  }

  render(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
  }

  private findLatestVersion(agentName: string): string {
    let files: string[];
    try {
      files = fs.readdirSync(this.promptsDir);
    } catch {
      throw new Error(`No prompt files found for agent: ${agentName}`);
    }

    const versions = files
      .filter((f) => f.startsWith(`${agentName}_v`) && f.endsWith('.md'))
      .map((f) => {
        const match = f.match(/_v(\d+)\.md$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0)
      .sort((a, b) => b - a);

    if (versions.length === 0) {
      throw new Error(`No prompt files found for agent: ${agentName}`);
    }

    return `v${versions[0]}`;
  }
}
