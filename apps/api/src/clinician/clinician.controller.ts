import { Controller, Get, Param, Body, Patch, UseGuards } from "@nestjs/common";
import { ClinicianService } from "./clinician.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { Role } from "@prisma/client";

@Controller("clinicians")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicianController {
  constructor(private clinicianService: ClinicianService) {}

  @Get("me")
  getMe(@CurrentUser() user: { userId: string; profileId: string }) {
    return this.clinicianService.findByUserId(user.userId);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.clinicianService.findAll();
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  findOne(@Param("id") id: string) {
    return this.clinicianService.findById(id);
  }

  @Patch(":id")
  @Roles(Role.CLINICIAN)
  update(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; profileId: string },
    @Body() body: Record<string, unknown>,
  ) {
    if (user.profileId !== id) {
      throw new Error("Cannot update another clinician's profile");
    }
    return this.clinicianService.update(id, body);
  }
}
