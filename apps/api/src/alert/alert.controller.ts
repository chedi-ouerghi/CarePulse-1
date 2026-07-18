import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  findActive() {
    return this.alertService.findActive();
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.alertService.findByPatient(patientId);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertService.acknowledge(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.alertService.resolve(id);
  }
}
