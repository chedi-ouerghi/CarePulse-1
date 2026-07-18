import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ClinicianService } from "./clinician.service";
import { ClinicianController } from "./clinician.controller";

@Module({
  imports: [AuthModule],
  providers: [ClinicianService],
  controllers: [ClinicianController],
  exports: [ClinicianService],
})
export class ClinicianModule { }
