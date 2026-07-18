import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ClinicianService } from "./clinician.service";
import { ClinicianCreateSchema } from "@carepulse/shared-types";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const createClinicianDto = new ZodValidationPipe(ClinicianCreateSchema);

@UseGuards(JwtAuthGuard)
@Controller("clinicians")
export class ClinicianController {
  constructor(private readonly clinicianService: ClinicianService) {}

  @Post()
  create(@Body(createClinicianDto) data: any) {
    return this.clinicianService.create(data);
  }

  @Get()
  findAll() {
    return this.clinicianService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.clinicianService.findById(id);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.clinicianService.delete(id);
  }
}
