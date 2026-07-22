import { Module } from "@nestjs/common";
import { ClinicianService } from "./clinician.service";
import { ClinicianController } from "./clinician.controller";

@Module({
  controllers: [ClinicianController],
  providers: [ClinicianService],
  exports: [ClinicianService],
})
export class ClinicianModule {}
