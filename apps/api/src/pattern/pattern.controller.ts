import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { PatternService } from "./pattern.service";
import { PatternStatus } from "@carepulse/shared-types";

@Controller("patterns")
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  @Get("patient/:patientId")
  findByPatient(@Param("patientId") patientId: string) {
    return this.patternService.findByPatient(patientId);
  }

  @Get("patient/:patientId/status/:status")
  findByPatientAndStatus(
    @Param("patientId") patientId: string,
    @Param("status") status: PatternStatus
  ) {
    return this.patternService.findByPatientAndStatus(patientId, status);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.patternService.findById(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: PatternStatus
  ) {
    return this.patternService.updateStatus(id, status);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.patternService.delete(id);
  }
}
