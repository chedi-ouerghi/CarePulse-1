import { Injectable, Logger } from '@nestjs/common';

export interface QueueJob {
  id: string;
  type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  async addJob(type: string, data: any): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.logger.debug(`Queue job added (sync mode): ${type} [${id}]`);
    return id;
  }

  async getJobStatus(id: string): Promise<QueueJob | null> {
    return null;
  }
}
