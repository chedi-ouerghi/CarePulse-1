import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ClinicalAnalysisService } from "./clinical-analysis.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("analyses")
export class ClinicalAnalysisController {
  constructor(
    private readonly clinicalAnalysisService: ClinicalAnalysisService
  ) {}

  @Get("patient/:patientId")
  findByPatient(@Param("patientId") patientId: string) {
    return this.clinicalAnalysisService.findByPatient(patientId);
  }

  @Get("patient/:patientId/latest")
  findLatest(@Param("patientId") patientId: string) {
    return this.clinicalAnalysisService.findLatest(patientId);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.clinicalAnalysisService.findById(id);
  }

  @Post("patient/:patientId")
  create(
    @Param("patientId") patientId: string,
    @Body()
    data: {
      periodStart: Date;
      periodEnd: Date;
      patterns: any;
      risks: any;
      recommendations: any;
      observations: any;
      stats: any;
      modelVersion?: string;
    }
  ) {
    return this.clinicalAnalysisService.create(patientId, data);
  }
}
