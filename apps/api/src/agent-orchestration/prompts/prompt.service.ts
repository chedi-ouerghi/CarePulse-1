import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const PROMPTS_DIR = path.join(__dirname, "files");

@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name);
  private readonly prompts = new Map<string, string>();

  constructor() {
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
      const filePath = path.join(PROMPTS_DIR, `${name}.md`);
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
