import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  get patient() { return this.client.patient; }
  get clinician() { return this.client.clinician; }
  get glucoseReading() { return this.client.glucoseReading; }
  get lifeEvent() { return this.client.lifeEvent; }
  get labResult() { return this.client.labResult; }
  get medication() { return this.client.medication; }
  get conversation() { return this.client.conversation; }
  get chatMessage() { return this.client.chatMessage; }
  get clinicalAnalysis() { return this.client.clinicalAnalysis; }
  get riskAssessment() { return this.client.riskAssessment; }
  get clinicalReport() { return this.client.clinicalReport; }
  get alert() { return this.client.alert; }
  get taskTracker() { return this.client.taskTracker; }

  get $connect() { return this.client.$connect.bind(this.client); }
  get $disconnect() { return this.client.$disconnect.bind(this.client); }
  get $transaction() { return this.client.$transaction.bind(this.client); }
  get $queryRaw() { return this.client.$queryRaw.bind(this.client); }
  get $executeRaw() { return this.client.$executeRaw.bind(this.client); }
}
