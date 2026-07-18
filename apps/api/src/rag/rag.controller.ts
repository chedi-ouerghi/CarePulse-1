import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { RagService } from './rag.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get('health')
  health() {
    return { status: 'ready', provider: 'none', message: 'RAG not yet implemented' };
  }

  @Post('search')
  search(@Body() body: { query: string; sources?: string[]; limit?: number }) {
    return this.ragService.search(body);
  }
}
