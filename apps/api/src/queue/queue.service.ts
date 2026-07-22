import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, Worker, Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";

// ── Job data types ──────────────────────────────────────────────────

export interface RiskScoringPayload {
  patientId: string;
}

export interface ClinicalAnalysisPayload {
  patientId: string;
  sourceClinicalRiskId?: string;
}

export interface ReportGenerationPayload {
  clinicalAnalysisId: string;
  patientId: string;
}

export type JobPayload =
  | RiskScoringPayload
  | ClinicalAnalysisPayload
  | ReportGenerationPayload;

// ── Queue names ─────────────────────────────────────────────────────

export const QUEUES = {
  RISK_SCORING: "risk-scoring",
  CLINICAL_ANALYSIS: "clinical-analysis",
  REPORT_GENERATION: "report-generation",
} as const;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection;
  private readonly workers: Worker[] = [];

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.connection = {
      host: this.parseRedisUrl("host"),
      port: this.parseRedisUrl("port"),
      password: this.parseRedisUrl("password"),
      db: 0,
    };
  }

  private parseRedisUrl(field: "host" | "port" | "password"): string {
    const url = this.config.get<string>("REDIS_URL", "redis://localhost:6379");
    try {
      const parsed = new URL(url);
      switch (field) {
        case "host":
          return parsed.hostname || "localhost";
        case "port":
          return parsed.port || "6379";
        case "password":
          return parsed.password || "";
        default:
          return "";
      }
    } catch {
      return field === "port" ? "6379" : field === "host" ? "localhost" : "";
    }
  }

  // ====================================================================
  // Enqueue
  // ====================================================================

  async enqueue(
    queueName: string,
    taskId: string,
    payload: JobPayload,
  ): Promise<void> {
    const queue = new Queue(queueName, { connection: this.connection });
    try {
      await queue.add(queueName, payload, {
        jobId: taskId,
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
      });
      this.logger.log(`Job enqueued: ${queueName} [${taskId}]`);
    } catch (err) {
      this.logger.warn(
        `Unable to enqueue job ${queueName} [${taskId}]: ${(err as Error).message}`,
      );
      throw err;
    } finally {
      await queue.close();
    }
  }

  // ====================================================================
  // Worker bootstrap — called once at module init
  // ====================================================================

  startWorkers(): void {
    const workersToStart = [
      { queueName: QUEUES.RISK_SCORING, handler: this.handleRiskScoring.bind(this) },
      {
        queueName: QUEUES.CLINICAL_ANALYSIS,
        handler: this.handleClinicalAnalysis.bind(this),
      },
      {
        queueName: QUEUES.REPORT_GENERATION,
        handler: this.handleReportGeneration.bind(this),
      },
    ] as const;

    for (const { queueName, handler } of workersToStart) {
      try {
        const worker = this.createWorker(queueName, handler);
        this.workers.push(worker);
      } catch (err) {
        this.logger.warn(
          `Unable to start BullMQ worker for ${queueName}: ${(err as Error).message}`,
        );
      }
    }

    if (this.workers.length > 0) {
      this.logger.log(`BullMQ workers started: ${this.workers.length}`);
    } else {
      this.logger.warn("BullMQ workers disabled because Redis is unavailable");
    }
  }

  private createWorker(queueName: string, handler: (job: Job) => Promise<void>): Worker {
    const worker = new Worker(queueName, handler, {
      connection: this.connection,
      concurrency: 2,
    });

    worker.on("completed", (job) => {
      this.logger.log(`Job completed: ${queueName} [${job.id}]`);
    });

    worker.on("failed", (job, err) => {
      this.logger.error(
        `Job failed: ${queueName} [${job?.id}] — ${err.message}`,
      );
    });

    return worker;
  }

  // ====================================================================
  // Handlers
  // ====================================================================

  private async handleRiskScoring(job: Job): Promise<void> {
    const taskId = String(job.id);
    const payload = job.data as RiskScoringPayload;

    await this.updateTask(taskId, "RUNNING");

    try {
      // Import TwinService lazily to avoid circular dependency
      const { TwinService } = await import("../twin/twin.service");
      const twinService = new TwinService(
        this.prisma,
        this.config,
        null as any, // alertsService not needed for risk scoring
      );

      const result = await twinService.refreshPatientInternal(payload.patientId);
      await this.updateTask(taskId, "COMPLETED", result);
    } catch (err) {
      await this.updateTask(taskId, "FAILED", undefined, (err as Error).message);
      throw err;
    }
  }

  private async handleClinicalAnalysis(job: Job): Promise<void> {
    const taskId = String(job.id);
    const payload = job.data as ClinicalAnalysisPayload;

    await this.updateTask(taskId, "RUNNING");

    try {
      const { AgentOrchestrationService } = await import(
        "../agent-orchestration/agent-orchestration.service"
      );
      const agentService = new AgentOrchestrationService(
        this.prisma,
        this.config,
      );

      const result = await agentService.runClinicalIntelligenceInternal(
        payload.patientId,
      );
      await this.updateTask(taskId, "COMPLETED", result);
    } catch (err) {
      await this.updateTask(taskId, "FAILED", undefined, (err as Error).message);
      throw err;
    }
  }

  private async handleReportGeneration(job: Job): Promise<void> {
    const taskId = String(job.id);
    const payload = job.data as ReportGenerationPayload;

    await this.updateTask(taskId, "RUNNING");

    try {
      const { AgentOrchestrationService } = await import(
        "../agent-orchestration/agent-orchestration.service"
      );
      const agentService = new AgentOrchestrationService(
        this.prisma,
        this.config,
      );

      const result = await agentService.generateClinicalReportInternal(
        payload.clinicalAnalysisId,
      );
      await this.updateTask(taskId, "COMPLETED", result);
    } catch (err) {
      await this.updateTask(taskId, "FAILED", undefined, (err as Error).message);
      throw err;
    }
  }

  // ====================================================================
  // TaskTracker updates
  // ====================================================================

  private async updateTask(
    taskId: string,
    status: "RUNNING" | "COMPLETED" | "FAILED",
    result?: unknown,
    error?: string,
  ): Promise<void> {
    const data: Record<string, unknown> = { status };
    if (status === "RUNNING") data.startedAt = new Date();
    if (status === "COMPLETED" || status === "FAILED") {
      data.completedAt = new Date();
    }
    if (result !== undefined) data.result = result;
    if (error) data.error = error;

    await this.prisma.taskTracker.update({
      where: { id: taskId },
      data,
    });
  }

  // ====================================================================
  // Lifecycle
  // ====================================================================

  async onModuleDestroy(): Promise<void> {
    for (const worker of this.workers) {
      await worker.close();
    }
  }
}

