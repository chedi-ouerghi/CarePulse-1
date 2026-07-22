import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { PatientService } from "./patient.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { Role } from "@prisma/client";
import { CreatePatientDto } from "./dto/create-patient.dto";

@Controller("patients")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(private patientService: PatientService) {}

  @Get("me")
  getMe(@CurrentUser() user: { userId: string; profileId: string }) {
    return this.patientService.findByUserId(user.userId);
  }

  @Get()
  @Roles(Role.CLINICIAN, Role.ADMIN)
  findAll() {
    return this.patientService.findAll();
  }

  @Get("clinic")
  @Roles(Role.CLINICIAN)
  findMyPatients(@CurrentUser() user: { userId: string; profileId: string }) {
    return this.patientService.findByClinicianId(user.profileId);
  }

  @Get(":id")
  @Roles(Role.CLINICIAN, Role.ADMIN)
  findOne(@Param("id") id: string) {
    return this.patientService.findById(id);
  }

  @Post()
  @Roles(Role.CLINICIAN, Role.ADMIN)
  create(
    @CurrentUser() user: { userId: string; profileId: string },
    @Body() dto: CreatePatientDto,
  ) {
    return this.patientService.create({
      ...dto,
      clinicianId: user.profileId,
    });
  }

  @Patch(":id")
  @Roles(Role.PATIENT)
  update(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; profileId: string },
    @Body() body: Record<string, unknown>,
  ) {
    if (user.profileId !== id) {
      throw new Error("Cannot update another patient's profile");
    }
    return this.patientService.update(id, body);
  }

  @Patch(":id/assign")
  @Roles(Role.CLINICIAN, Role.ADMIN)
  assignClinician(
    @Param("id") id: string,
    @CurrentUser() user: { userId: string; profileId: string },
  ) {
    return this.patientService.assignClinician(id, user.profileId);
  }
}
