import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post(':patientId')
  create(
    @Param('patientId') patientId: string,
    @Body() body: { type: string; timestamp?: string; metadata?: any },
  ) {
    return this.eventsService.create(patientId, body);
  }
}
