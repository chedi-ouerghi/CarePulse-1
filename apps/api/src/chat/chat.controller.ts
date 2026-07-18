import { Controller, Get, Post, Param, Body, Logger, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SendMessageDto } from "./dto/send-message.dto";

@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  private readonly logger = new Logger(ChatController.name);
  constructor(private readonly chatService: ChatService) {}

  @Get("conversations/:patientId")
  getConversations(@Param("patientId") patientId: string) {
    return this.chatService.getConversations(patientId);
  }

  @Get("messages/:conversationId")
  getMessages(@Param("conversationId") conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post("send")
  sendMessage(@Body() dto: SendMessageDto) {
    this.logger.log(
      `Sending message from patient ${dto.patientId} to conversation ${dto.conversationId || "new"}`
    );
    return this.chatService.sendMessage(
      dto.patientId,
      dto.conversationId,
      dto.content
    );
  }
}
