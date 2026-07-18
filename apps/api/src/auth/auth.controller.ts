import { Controller, Post, Body, Get, UseGuards, Request } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login/patient")
  loginPatient(@Body() body: { email: string; password: string }) {
    return this.authService.loginPatient(body.email, body.password);
  }

  @Post("login/clinician")
  loginClinician(@Body() body: { email: string; password: string }) {
    return this.authService.loginClinician(body.email, body.password);
  }

  @Post("register/patient")
  registerPatient(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      diabetesType: string;
    }
  ) {
    return this.authService.registerPatient(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@Request() req: any) {
    return this.authService.validateToken(req.user);
  }
}
