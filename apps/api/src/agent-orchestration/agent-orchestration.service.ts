import { Injectable, Logger } from "@nestjs/common";
import { AnthropicService } from "./anthropic/anthropic.service";
import { PromptService } from "./prompts/prompt.service";
import { TwinService } from "../twin/twin.service";
import { PatternService } from "../pattern/pattern.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  DataStewardOutput,
  PatternAgentOutput,
  CoachMessage,
  BriefAgentOutput,
} from "@carepulse/shared-types";
import {
  DataStewardOutputSchema,
  PatternAgentOutputSchema,
  CoachMessageSchema,
  BriefAgentOutputSchema,
} from "@carepulse/shared-types";
import { ZodSchema } from "zod";

export interface AgentRunResult<T = unknown> {
  agent: string;
  success: boolean;
  data: T | null;
  error?: string;
  latencyMs: number;
}

@Injectable()
export class AgentOrchestrationService {
  private readonly logger = new Logger(AgentOrchestrationService.name);

  constructor(
    private anthropic: AnthropicService,
    private prompts: PromptService,
    private twinService: TwinService,
    private patternService: PatternService,
    private prisma: PrismaService
  ) {}

  async runDataSteward(
    patientId: string
  ): Promise<AgentRunResult<DataStewardOutput>> {
    const start = Date.now();
    try {
      const twin = await this.twinService.buildTwinState(patientId);

      const userMessage = JSON.stringify({
        readings: twin.cleanedReadings,
        gaps: twin.gapsDetected,
        stats: twin.stats,
      });

      if (!this.anthropic.isAvailable) {
        return this.mockDataSteward(twin, start);
      }

      const raw = await this.anthropic.createMessage(
        this.prompts.getPrompt("data-steward"),
        userMessage
      );

      const parsed = this.parseAndValidate(DataStewardOutputSchema, raw);
      return {
        agent: "data_steward",
        success: true,
        data: parsed as DataStewardOutput,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Data Steward failed: ${err}`);
      return {
        agent: "data_steward",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  async runPatternAgent(
    patientId: string
  ): Promise<AgentRunResult<PatternAgentOutput>> {
    const start = Date.now();
    try {
      const twin = await this.twinService.buildTwinState(patientId);
      const existingPatterns =
        await this.patternService.findByPatient(patientId);

      const userMessage = JSON.stringify({
        twinState: {
          stats: twin.stats,
          gaps: twin.gapsDetected,
          readingCount: twin.cleanedReadings.length,
        },
        recentReadings: twin.cleanedReadings.slice(-100),
        existingPatterns: existingPatterns.map((p) => ({
          summary: p.summary,
          triggerEventType: p.triggerEventType,
          detectedAt: p.detectedAt,
        })),
      });

      if (!this.anthropic.isAvailable) {
        return this.mockPatternAgent(patientId, start);
      }

      const raw = await this.anthropic.createMessage(
        this.prompts.getPrompt("pattern-agent"),
        userMessage
      );

      const parsed = this.parseAndValidate(
        PatternAgentOutputSchema,
        raw
      ) as PatternAgentOutput;

      if (parsed) {
        for (const p of parsed.patterns) {
          if (p.confidence >= 0.6) {
            await this.patternService.create(patientId, {
              summary: p.summary,
              confidence: p.confidence,
              triggerEventType: p.triggerEventType,
              supportingDataPoints: p.supportingDataPoints,
            });
          }
        }
      }

      return {
        agent: "pattern_agent",
        success: true,
        data: parsed,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Pattern Agent failed: ${err}`);
      return {
        agent: "pattern_agent",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  async runCoachAgent(
    patientId: string,
    patternId?: string
  ): Promise<AgentRunResult<CoachMessage>> {
    const start = Date.now();
    try {
      let pattern: any = null;
      if (patternId) {
        pattern = await this.patternService.findById(patternId);
      } else {
        const patterns = await this.patternService.findByPatient(patientId);
        pattern = patterns.length > 0 ? patterns[0] : null;
      }

      if (!pattern) {
        return {
          agent: "coach",
          success: true,
          data: {
            message:
              "No patterns detected yet. Keep logging your data and I'll let you know when I notice something!",
            tone: "supportive",
            suggestedAction: null,
          },
          latencyMs: Date.now() - start,
        };
      }

      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
      });

      const userMessage = JSON.stringify({
        pattern: {
          summary: pattern.summary,
          confidence: pattern.confidence,
          triggerEventType: pattern.triggerEventType,
        },
        patientProfile: {
          diabetesType: patient?.diabetesType,
          name: "[redacted]",
        },
      });

      if (!this.anthropic.isAvailable) {
        return this.mockCoachAgent(pattern, start);
      }

      const raw = await this.anthropic.createMessage(
        this.prompts.getPrompt("coach-agent"),
        userMessage
      );

      const parsed = this.parseAndValidate(
        CoachMessageSchema,
        raw
      ) as CoachMessage;
      return {
        agent: "coach",
        success: true,
        data: parsed,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Coach Agent failed: ${err}`);
      return {
        agent: "coach",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  async runCareCoordinatorAgent(
    patientId: string,
    periodDays: number = 90
  ): Promise<AgentRunResult<BriefAgentOutput>> {
    const start = Date.now();
    try {
      const since = new Date();
      since.setDate(since.getDate() - periodDays);

      const [patterns, twin] = await Promise.all([
        this.patternService.findByPatient(patientId),
        this.twinService.buildTwinState(patientId, periodDays),
      ]);

      const userMessage = JSON.stringify({
        patterns: patterns.map((p) => ({
          summary: p.summary,
          confidence: p.confidence,
          triggerEventType: p.triggerEventType,
          detectedAt: p.detectedAt,
        })),
        stats: twin.stats,
        period: {
          start: since.toISOString(),
          end: new Date().toISOString(),
        },
      });

      if (!this.anthropic.isAvailable) {
        return this.mockCareCoordinator(patterns, twin, start);
      }

      const raw = await this.anthropic.createMessage(
        this.prompts.getPrompt("care-coordinator"),
        userMessage
      );

      const parsed = this.parseAndValidate(
        BriefAgentOutputSchema,
        raw
      ) as BriefAgentOutput;
      return {
        agent: "care_coordinator",
        success: true,
        data: parsed,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Care Coordinator failed: ${err}`);
      return {
        agent: "care_coordinator",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  private parseAndValidate<T>(schema: ZodSchema, raw: string): T {
    let jsonStr = raw;
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      const obj = JSON.parse(jsonStr);
      return schema.parse(obj) as T;
    } catch (err) {
      this.logger.warn(`Parse/validate failed, using raw JSON`);
      return JSON.parse(jsonStr) as T;
    }
  }

  private mockDataSteward(
    twin: any,
    start: number
  ): AgentRunResult<DataStewardOutput> {
    return {
      agent: "data_steward",
      success: true,
      data: {
        cleanedReadings: twin.cleanedReadings.map((r: any) => ({
          id: r.id,
          value: r.value,
          timestamp: r.timestamp,
          source: r.source,
          isAnomaly: r.isAnomaly || false,
          anomalyReason: r.anomalyReason,
        })),
        gapsDetected: twin.gapsDetected,
        dataQualityScore: twin.dataQualityScore,
      },
      latencyMs: Date.now() - start,
    };
  }

  private mockPatternAgent(
    patientId: string,
    start: number
  ): AgentRunResult<PatternAgentOutput> {
    return {
      agent: "pattern_agent",
      success: true,
      data: {
        patterns: [
          {
            summary:
              "Stressful evening events appear to be associated with glucose spikes approximately 2 hours later. This pattern has been observed in the last 3 occurrences.",
            triggerEventType: "stress",
            confidence: 0.78,
            supportingDataPoints: ["mock_reading_1", "mock_event_1"],
          },
        ],
      },
      latencyMs: Date.now() - start,
    };
  }

  private mockCoachAgent(
    pattern: any,
    start: number
  ): AgentRunResult<CoachMessage> {
    return {
      agent: "coach",
      success: true,
      data: {
        message: `It looks like ${pattern.triggerEventType} might be affecting your glucose levels a couple of hours later. Want me to give you a heads-up next time?`,
        tone: "supportive",
        suggestedAction: "enable_stress_heads_up_notification",
      },
      latencyMs: Date.now() - start,
    };
  }

  private mockCareCoordinator(
    patterns: any[],
    twin: any,
    start: number
  ): AgentRunResult<BriefAgentOutput> {
    return {
      agent: "care_coordinator",
      success: true,
      data: {
        headline:
          "Overall stable control; recurrent post-stress glycemic excursions to investigate.",
        keyPatterns: patterns.slice(0, 3).map((p: any) => ({
          summary: p.summary,
          confidence: p.confidence,
          triggerEventType: p.triggerEventType,
        })),
        statsSnapshot: {
          timeInRange: twin.stats.timeInRange,
          avgGlucose: twin.stats.avgGlucose,
          hypoEvents: twin.stats.hypoEvents,
        },
        suggestedDiscussionPoints: [
          "Stress management strategies as complement to current regimen",
          "Consider timing of glucose monitoring after reported stress events",
        ],
      },
      latencyMs: Date.now() - start,
    };
  }
}
