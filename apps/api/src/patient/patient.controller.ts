import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { PatientService } from "./patient.service";
import { PatientCreateSchema } from "@carepulse/shared-types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const createPatientDto = new ZodValidationPipe(PatientCreateSchema);

@UseGuards(JwtAuthGuard)
@Controller("patients")
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(@Body(createPatientDto) data: any) {
    return this.patientService.create(data);
  }

  @Get()
  findAll() {
    return this.patientService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.patientService.findById(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.patientService.update(id, data);
  }

  @Patch(":id/clinician/:clinicianId")
  assignClinician(
    @Param("id") id: string,
    @Param("clinicianId") clinicianId: string
  ) {
    return this.patientService.assignClinician(id, clinicianId);
  }

  @Get(":id/state")
  getState(@Param("id") id: string) {
    return this.patientService.getState(id);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.patientService.delete(id);
  }
}
