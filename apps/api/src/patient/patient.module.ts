import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PatientService } from "./patient.service";
import { PatientController } from "./patient.controller";

@Module({
  imports: [AuthModule],
  providers: [PatientService],
  controllers: [PatientController],
  exports: [PatientService],
})
export class PatientModule { }
