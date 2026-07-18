import { Injectable, Logger } from "@nestjs/common";
import { MistralAiService } from "./mistral-ai/mistral-ai.service";
import { PromptService } from "./prompts/prompt.service";
import { TwinService } from "../twin/twin.service";
import { ClinicalAnalysisService } from "../clinical-analysis/clinical-analysis.service";
import { ClinicalReportService } from "../clinical-report/clinical-report.service";
import { PrismaService } from "../prisma/prisma.service";
import { TaskTrackerService } from "../task-tracker/task-tracker.service";

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
    private mistralAi: MistralAiService,
    private prompts: PromptService,
    private twinService: TwinService,
    private analysisService: ClinicalAnalysisService,
    private reportService: ClinicalReportService,
    private prisma: PrismaService,
    private taskTracker: TaskTrackerService
  ) {}

  async runClinicalAnalysis(
    patientId: string,
    periodDays: number = 14
  ): Promise<AgentRunResult<any>> {
    const task = await this.taskTracker.create(patientId, "clinical_analysis", { periodDays });
    const start = Date.now();
    try {
      const since = new Date();
      since.setDate(since.getDate() - periodDays);
      const now = new Date();

      const twin = await this.twinService.buildTwinState(patientId, periodDays);
      const existingAnalyses = await this.analysisService.findByPatient(patientId);

      const userMessage = JSON.stringify({
        twinState: {
          stats: twin.stats,
          gaps: twin.gapsDetected,
          readingCount: twin.cleanedReadings.length,
        },
        recentReadings: twin.cleanedReadings.slice(-200),
        previousAnalyses: existingAnalyses.slice(0, 3).map((a) => ({
          patterns: a.patterns,
          risks: a.risks,
          generatedAt: a.generatedAt,
        })),
      });

      if (!this.mistralAi.isAvailable) {
        const result = await this.mockAnalysis(patientId, twin, start, since, now);
        await this.taskTracker.updateStatus(task.id, "completed", result);
        return result;
      }

      const raw = await this.mistralAi.createMessage(
        this.prompts.getPrompt("pattern-agent"),
        userMessage
      );

      let parsed: any;
      try {
        let jsonStr = raw;
        const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        parsed = JSON.parse(jsonStr);
      } catch {
        parsed = {
          patterns: [{ summary: raw.slice(0, 500), confidence: 0.5, triggerEventType: "unknown" }],
          risks: [{ type: "general", level: "medium", description: "Needs review" }],
          recommendations: ["Consult healthcare provider"],
          observations: [raw.slice(0, 200)],
        };
      }

      const analysis = await this.analysisService.create(patientId, {
        periodStart: since,
        periodEnd: now,
        patterns: parsed.patterns || [],
        risks: parsed.risks || [],
        recommendations: parsed.recommendations || [],
        observations: parsed.observations || [],
        stats: twin.stats,
        modelVersion: this.mistralAi.isAvailable ? "mistral-small-latest" : "mock",
      });

      await this.taskTracker.updateStatus(task.id, "completed", analysis);

      return {
        agent: "clinical_analysis",
        success: true,
        data: analysis,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Clinical Analysis failed: ${err}`);
      await this.taskTracker.updateStatus(task.id, "failed", null, err instanceof Error ? err.message : "Unknown error");
      return {
        agent: "clinical_analysis",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  async runCareCoordinator(
    patientId: string,
    clinicianId: string,
    periodDays: number = 90
  ): Promise<AgentRunResult<any>> {
    const task = await this.taskTracker.create(patientId, "care_coordinator", { clinicianId, periodDays });
    const start = Date.now();
    try {
      const since = new Date();
      since.setDate(since.getDate() - periodDays);
      const now = new Date();

      const [analyses, twin] = await Promise.all([
        this.analysisService.findByPatient(patientId),
        this.twinService.buildTwinState(patientId, periodDays),
      ]);

      const latestAnalysis = analyses[0];

      const prevPatterns = (latestAnalysis?.patterns as any[]) || [];
      const prevRisks = (latestAnalysis?.risks as any[]) || [];
      const prevRecommendations = (latestAnalysis?.recommendations as any[]) || [];

      const userMessage = JSON.stringify({
        patterns: prevPatterns,
        risks: prevRisks,
        recommendations: prevRecommendations,
        stats: twin.stats,
        period: { start: since.toISOString(), end: now.toISOString() },
      });

      let reportSummary: any;

      if (!this.mistralAi.isAvailable) {
        reportSummary = {
          headline: "Clinical status review based on available data.",
          keyFindings: prevPatterns.slice(0, 3).map((p: any) => ({
            category: p.triggerEventType || "general",
            finding: p.summary || "No details",
          })),
          statsSnapshot: {
            timeInRange: twin.stats.timeInRange,
            avgGlucose: twin.stats.avgGlucose,
            hypoEvents: twin.stats.hypoEvents,
            hyperEvents: twin.stats.hyperEvents || 0,
          },
          riskScores: {
            hyperglycemia: 0.5,
            hypoglycemia: 0.3,
            adherence: 0.7,
            lifestyle: 0.6,
          },
          recommendations: prevRecommendations.length > 0 ? prevRecommendations : ["Continue monitoring"],
        };
      } else {
        const raw = await this.mistralAi.createMessage(
          this.prompts.getPrompt("care-coordinator"),
          userMessage
        );

        try {
          let jsonStr = raw;
          const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) jsonStr = jsonMatch[1];
          const parsed = JSON.parse(jsonStr);
          reportSummary = {
            headline: parsed.headline || "Clinical review",
            keyFindings: (parsed.keyPatterns || []).map((p: any) => ({
              category: p.triggerEventType || "general",
              finding: p.summary || "",
            })),
            statsSnapshot: {
              timeInRange: twin.stats.timeInRange,
              avgGlucose: twin.stats.avgGlucose,
              hypoEvents: twin.stats.hypoEvents,
              hyperEvents: twin.stats.hyperEvents || 0,
            },
            riskScores: {
              hyperglycemia: 0.5,
              hypoglycemia: 0.3,
              adherence: 0.7,
              lifestyle: 0.6,
            },
            recommendations: parsed.suggestedDiscussionPoints || [],
          };
        } catch {
          reportSummary = {
            headline: raw.slice(0, 200),
            keyFindings: [],
            statsSnapshot: {
              timeInRange: twin.stats.timeInRange,
              avgGlucose: twin.stats.avgGlucose,
              hypoEvents: twin.stats.hypoEvents,
              hyperEvents: twin.stats.hyperEvents || 0,
            },
            riskScores: { hyperglycemia: 0.5, hypoglycemia: 0.3, adherence: 0.7, lifestyle: 0.6 },
            recommendations: [],
          };
        }
      }

      const report = await this.reportService.create(patientId, {
        clinicianId,
        summary: reportSummary,
        periodStart: since,
        periodEnd: now,
      });

      await this.taskTracker.updateStatus(task.id, "completed", report);

      return {
        agent: "care_coordinator",
        success: true,
        data: report,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Care Coordinator failed: ${err}`);
      await this.taskTracker.updateStatus(task.id, "failed", null, err instanceof Error ? err.message : "Unknown error");
      return {
        agent: "care_coordinator",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  async generateRiskAssessment(
    patientId: string
  ): Promise<AgentRunResult<any>> {
    const task = await this.taskTracker.create(patientId, "risk_assessment", {});
    const start = Date.now();
    try {
      const twin = await this.twinService.buildTwinState(patientId, 14);
      const stats = twin.stats;

      const hyperRisk = stats.totalReadings > 0
        ? Math.min(1, (stats.hyperEvents || 0) / stats.totalReadings * 5)
        : 0;
      const hypoRisk = stats.totalReadings > 0
        ? Math.min(1, stats.hypoEvents / stats.totalReadings * 10)
        : 0;
      const adherence = stats.totalReadings > 0 ? Math.min(1, stats.totalReadings / (14 * 288)) : 0;
      const lifestyle = stats.timeInRange;

      const overallScore = (hyperRisk + hypoRisk + (1 - adherence) + (1 - lifestyle)) / 4;
      const overallRisk = overallScore > 0.7 ? "high" : overallScore > 0.4 ? "medium" : "low";

      const assessment = await this.prisma.riskAssessment.create({
        data: {
          patientId,
          hyperglycemiaRisk: Number(hyperRisk.toFixed(3)),
          hypoglycemiaRisk: Number(hypoRisk.toFixed(3)),
          adherenceScore: Number(adherence.toFixed(3)),
          lifestyleScore: Number(lifestyle.toFixed(3)),
          overallRisk,
          details: {
            avgGlucose: stats.avgGlucose,
            timeInRange: stats.timeInRange,
            totalReadings: stats.totalReadings,
          },
        },
      });

      await this.taskTracker.updateStatus(task.id, "completed", assessment);

      return {
        agent: "risk_assessment",
        success: true,
        data: assessment,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      this.logger.error(`Risk Assessment failed: ${err}`);
      await this.taskTracker.updateStatus(task.id, "failed", null, err instanceof Error ? err.message : "Unknown error");
      return {
        agent: "risk_assessment",
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Unknown error",
        latencyMs: Date.now() - start,
      };
    }
  }

  private async mockAnalysis(
    patientId: string,
    twin: any,
    start: number,
    periodStart: Date,
    periodEnd: Date
  ): Promise<AgentRunResult<any>> {
    const analysis = await this.analysisService.create(patientId, {
      periodStart,
      periodEnd,
      patterns: [
        {
          summary: "Glucose spikes appear to follow stressful evening events, approximately 2h later.",
          triggerEventType: "stress",
          confidence: 0.78,
        },
      ],
      risks: [
        { type: "hyperglycemia", level: "medium", description: "Frequent post-meal spikes detected" },
      ],
      recommendations: [
        "Consider reviewing meal timing",
        "Monitor glucose 2h after stressful events",
      ],
      observations: [
        "Average glucose is within target range",
        "Data completeness is good",
      ],
      stats: twin.stats,
      modelVersion: "mock_v1",
    });

    return {
      agent: "clinical_analysis",
      success: true,
      data: analysis,
      latencyMs: Date.now() - start,
    };
  }
}
