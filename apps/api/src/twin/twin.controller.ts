import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { TwinService } from "./twin.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("twin")
export class TwinController {
  constructor(private readonly twinService: TwinService) {}

  @Get(":patientId")
  getTwinState(
    @Param("patientId") patientId: string,
    @Query("days") days?: string
  ) {
    const windowDays = days ? parseInt(days, 10) : 14;
    return this.twinService.buildTwinState(patientId, windowDays);
  }
}
