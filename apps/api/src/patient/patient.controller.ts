import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Patch,
} from "@nestjs/common";
import { PatientService } from "./patient.service";
import { PatientCreateSchema } from "@carepulse/shared-types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const createPatientDto = new ZodValidationPipe(PatientCreateSchema);

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

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.patientService.delete(id);
  }
}
