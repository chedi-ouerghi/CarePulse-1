import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../ingestion/ingestion.service";
import { ActivateChannelDto } from "./dto/activate-channel.dto";
import { SendMessageDto } from "./dto/send-message.dto";

import { Roles } from "../auth/roles.decorator";
import { Role } from "@prisma/client";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  // ── Channel activation ────────────────────────────────────────────

  @Post("chat/channels/:patientId/activate")
  activateChannel(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Body() dto: ActivateChannelDto,
  ) {
    return this.chatService.activateChannel(user, patientId, dto);
  }

  // ── Conversations ─────────────────────────────────────────────────

  @Post("chat/patient/:patientId/conversations")
  createConversation(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    return this.chatService.createConversationForPatient(user, patientId);
  }

  @Get("chat/patient/:patientId")
  getConversations(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    return this.chatService.getConversations(user, patientId);
  }

  @Get("chat/clinician/patient/:patientId")
  @Roles(Role.CLINICIAN)
  getPatientConversationsForClinician(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    return this.chatService.getPatientConversationsForClinician(user, patientId);
  }

  // ── Messages ──────────────────────────────────────────────────────

  @Post("chat/:conversationId/messages")
  sendMessage(
    @CurrentUser() user: AuthUser,
    @Param("conversationId") conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(user, conversationId, dto);
  }

  @Get("chat/:conversationId/messages")
  getMessages(
    @CurrentUser() user: AuthUser,
    @Param("conversationId") conversationId: string,
  ) {
    return this.chatService.getMessages(user, conversationId);
  }
}
