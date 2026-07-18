import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

function resolvePromptsDir(): string {
  const candidates = [
    path.join(__dirname, "files"),
    path.join(__dirname, "..", "..", "..", "src", "agent-orchestration", "prompts", "files"),
    path.join(process.cwd(), "src", "agent-orchestration", "prompts", "files"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0];
}

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly prompts = new Map<string, string>();
  private readonly promptsDir: string;

  constructor() {
    this.promptsDir = resolvePromptsDir();
    this.loadPrompts();
  }

  private loadPrompts() {
    const promptNames = [
      "data-steward",
      "pattern-agent",
      "coach-agent",
      "care-coordinator",
    ];

    for (const name of promptNames) {
      const filePath = path.join(this.promptsDir, `${name}.md`);
      try {
        if (fs.existsSync(filePath)) {
          this.prompts.set(name, fs.readFileSync(filePath, "utf-8"));
          this.logger.log(`Loaded prompt: ${name}`);
        }
      } catch {
        this.logger.warn(`Could not load prompt: ${name}`);
      }
    }
  }

  getPrompt(name: string): string {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt '${name}' not found`);
    }
    return prompt;
  }

  hasPrompt(name: string): boolean {
    return this.prompts.has(name);
  }
}
