import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ClinicalReportService } from "./clinical-report.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("reports")
export class ClinicalReportController {
  constructor(
    private readonly clinicalReportService: ClinicalReportService
  ) {}

  @Get("patient/:patientId")
  findByPatient(@Param("patientId") patientId: string) {
    return this.clinicalReportService.findByPatient(patientId);
  }

  @Get("patient/:patientId/latest")
  findLatest(@Param("patientId") patientId: string) {
    return this.clinicalReportService.findLatestForPatient(patientId);
  }

  @Get("clinician/:clinicianId")
  findByClinician(@Param("clinicianId") clinicianId: string) {
    return this.clinicalReportService.findByClinician(clinicianId);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.clinicalReportService.findById(id);
  }

  @Post("patient/:patientId")
  create(
    @Param("patientId") patientId: string,
    @Body()
    data: {
      clinicianId: string;
      summary: any;
      periodStart: Date;
      periodEnd: Date;
      signedByAi?: boolean;
    }
  ) {
    return this.clinicalReportService.create(patientId, data);
  }
}
