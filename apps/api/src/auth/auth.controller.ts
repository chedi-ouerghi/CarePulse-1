import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterPatientDto } from "./dto/register-patient.dto";
import { RegisterClinicianDto } from "./dto/register-clinician.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("login/patient")
  loginPatient(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("login/clinician")
  loginClinician(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("register/patient")
  registerPatient(@Body() dto: RegisterPatientDto) {
    return this.authService.registerPatient(dto);
  }

  @Post("register/clinician")
  registerClinician(@Body() dto: RegisterClinicianDto) {
    return this.authService.registerClinician(dto);
  }
}
