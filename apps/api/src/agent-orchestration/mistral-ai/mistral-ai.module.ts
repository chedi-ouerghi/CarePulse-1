import { Module, Global } from "@nestjs/common";
import { MistralAiService } from "./mistral-ai.service";

@Global()
@Module({
  providers: [MistralAiService],
  exports: [MistralAiService],
})
export class MistralAiModule {}
