import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class MistralAiService {
  private readonly logger = new Logger(MistralAiService.name);
  private readonly apiKey: string | null;
  private readonly model = process.env.MISTRAL_MODEL || "mistral-small-latest";
  private readonly baseUrl = "https://api.mistral.ai/v1/chat/completions";

  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY?.trim() || null;
    if (this.apiKey) {
      this.logger.log(`Mistral AI (${this.model}) client initialized`);
    } else {
      this.logger.warn("No MISTRAL_API_KEY set — LLM calls will use mocks");
    }
  }

  get isAvailable(): boolean {
    return this.apiKey !== null;
  }

  async createMessage(
    systemPrompt: string,
    userMessage: string,
    maxTokens: number = 2048
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Mistral AI client not initialized — no API key");
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Mistral AI request failed (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("No text content in Mistral AI response");
    }
    return content;
  }
}
