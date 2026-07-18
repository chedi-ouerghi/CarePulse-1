import { Injectable, Logger } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private client: Anthropic | null = null;
  private readonly model = "claude-sonnet-4-20250514";

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log("Anthropic client initialized");
    } else {
      this.logger.warn(
        "No ANTHROPIC_API_KEY set — LLM calls will use mocks"
      );
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  async createMessage(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = 2048
  ): Promise<string> {
    if (!this.client) {
      throw new Error("Anthropic client not initialized — no API key");
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in response");
    }
    return textBlock.text;
  }
}
