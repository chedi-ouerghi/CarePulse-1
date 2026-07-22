import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AlertsService } from "./alerts.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../ingestion/ingestion.service";
import { AuditLog } from "../audit/audit.decorator";
import { AlertSeverity, AlertCategory, Role } from "@prisma/client";

@Controller("alerts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query("severity") severity?: AlertSeverity,
    @Query("category") category?: AlertCategory,
    @Query("status") status?: string,
  ) {
    return this.alertsService.findAll(user, { severity, category, status });
  }

  @Get("patient/:patientId")
  @Roles(Role.PATIENT, Role.CLINICIAN, Role.ADMIN)
  findByPatient(
    @CurrentUser() user: AuthUser,
    @Param("patientId") patientId: string,
  ) {
    return this.alertsService.findByPatient(user, patientId);
  }

  @Patch(":id/acknowledge")
  @Roles(Role.CLINICIAN)
  @AuditLog({ action: "ALERT_ACKNOWLEDGED", entityType: "Alert" })
  acknowledge(
    @CurrentUser() user: AuthUser,
    @Param("id") alertId: string,
  ) {
    return this.alertsService.acknowledge(user, alertId);
  }

  @Patch(":id/resolve")
  @Roles(Role.CLINICIAN)
  @AuditLog({ action: "ALERT_RESOLVED", entityType: "Alert" })
  resolve(
    @CurrentUser() user: AuthUser,
    @Param("id") alertId: string,
  ) {
    return this.alertsService.resolve(user, alertId);
  }
}
