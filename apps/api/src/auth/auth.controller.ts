import { Controller, Post, Body, Get, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterPatientDto } from "./dto/register-patient.dto";
import { RegisterClinicianDto } from "./dto/register-clinician.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login/patient")
  loginPatient(@Body() body: LoginDto) {
    return this.authService.loginPatient(body.email, body.password);
  }

  @Post("login/clinician")
  loginClinician(@Body() body: LoginDto) {
    return this.authService.loginClinician(body.email, body.password);
  }

  @Post("register/patient")
  registerPatient(@Body() body: RegisterPatientDto) {
    return this.authService.registerPatient(body);
  }

  @Post("register/clinician")
  registerClinician(@Body() body: RegisterClinicianDto) {
    return this.authService.registerClinician(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@Request() req: any) {
    return this.authService.validateToken(req.user);
  }
}
