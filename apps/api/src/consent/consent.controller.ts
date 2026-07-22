import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ConsentService } from "./consent.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../ingestion/ingestion.service";
import { ConsentType } from "@prisma/client";

@Controller("consent")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentController {
  constructor(private consentService: ConsentService) {}

  @Get(":patientId")
  findAll(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    return this.consentService.findAll(user, patientId);
  }

  @Post(":patientId")
  grant(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Body("type") type: ConsentType,
  ) {
    return this.consentService.grant(user, patientId, type);
  }

  @Delete(":patientId")
  revoke(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
    @Body("type") type: ConsentType,
  ) {
    return this.consentService.revoke(user, patientId, type);
  }
}
