import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { GlucoseService } from './glucose.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('glucose')
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  @Post(':patientId')
  create(
    @Param('patientId') patientId: string,
    @Body() body: { value: number; timestamp?: string; source?: string },
  ) {
    return this.glucoseService.create(patientId, body);
  }

  @Post(':patientId/bulk')
  createMany(
    @Param('patientId') patientId: string,
    @Body() body: { readings: Array<{ value: number; timestamp: string; source?: string }> },
  ) {
    return this.glucoseService.createMany(patientId, body.readings);
  }
}
