import { Module } from "@nestjs/common";
import { ClinicianService } from "./clinician.service";
import { ClinicianController } from "./clinician.controller";

@Module({
  providers: [ClinicianService],
  controllers: [ClinicianController],
  exports: [ClinicianService],
})
export class ClinicianModule {}
