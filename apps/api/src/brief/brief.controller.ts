import { Controller, Get, Param } from "@nestjs/common";
import { BriefService } from "./brief.service";

@Controller("briefs")
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Get("patient/:patientId")
  findByPatient(@Param("patientId") patientId: string) {
    return this.briefService.findByPatient(patientId);
  }

  @Get("patient/:patientId/latest")
  findLatest(@Param("patientId") patientId: string) {
    return this.briefService.findLatestForPatient(patientId);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.briefService.findById(id);
  }
}
