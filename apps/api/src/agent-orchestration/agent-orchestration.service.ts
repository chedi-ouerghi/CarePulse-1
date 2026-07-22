import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../ingestion/ingestion.service";

// ── Types for POST /chat response ───────────────────────────────────

interface PyChatResponse {
  reply: string;
  model: string;
  source: "mistral" | "fallback";
}

interface Agent1Result {
  patterns: string[];
  correlations: { factor: string; effect: string; strength: number }[];
  explanations: string;
  aggravatingFactors: string[];
  confidenceLevel: number;
  recommendations: string[];
}

interface Agent2Result {
  summary: string;
  fullReport: string;
  priorities: string[];
  recommendations: string[];
  pointsToWatch: string[];
}

@Injectable()
export class AgentOrchestrationService {
  private readonly logger = new Logger(AgentOrchestrationService.name);
  private readonly riskModelUrl: string;
  private readonly mistralModel: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.riskModelUrl = this.config.get<string>(
      "RISK_MODEL_URL",
      "http://localhost:8000",
    );
    this.mistralModel = this.config.get<string>(
      "MISTRAL_MODEL",
      "mistral-small-latest",
    );
  }

  // ====================================================================
  // Authorization helpers
  // ====================================================================

  async assertCanRead(
    user: AuthUser,
    patientId: string,
  ): Promise<void> {
    if (user.role === Role.PATIENT) {
      if (user.profileId !== patientId)
        throw new ForbiddenException("Cannot access another patient's data");
      return;
    }
    if (user.role === Role.CLINICIAN) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { clinicianId: true },
      });
      if (!patient) throw new NotFoundException("Patient not found");
      if (patient.clinicianId !== user.profileId)
        throw new ForbiddenException(
          "Cannot access data of a patient not assigned to you",
        );
      return;
    }
    throw new ForbiddenException("Insufficient permissions");
  }

  // ====================================================================
  // HTTP client — POST /chat
  // ====================================================================

  private async chatCompletion(
    systemPrompt: string,
    userMessage: string,
  ): Promise<PyChatResponse> {
    const url = `${this.riskModelUrl}/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: userMessage }],
        system_prompt: systemPrompt,
        model: this.mistralModel,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      this.logger.warn(`POST /chat returned ${res.status}: ${text}`);
      throw new Error(`Chat service error (${res.status})`);
    }

    return res.json() as Promise<PyChatResponse>;
  }

  // ====================================================================
  // Agent 1 — Clinical Intelligence Agent
  // ====================================================================

  async runClinicalIntelligence(
    user: AuthUser,
    patientId: string,
  ) {
    await this.assertCanRead(user, patientId);
    return this.runClinicalIntelligenceInternal(patientId);
  }

  /** Internal version for queue workers — skips auth. */
  async runClinicalIntelligenceInternal(patientId: string) {

    // ── Gather context ──────────────────────────────────────────────
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException("Patient not found");

    const latestSnapshot = await this.prisma.twinSnapshot.findFirst({
      where: { patientId },
      orderBy: { generatedAt: "desc" },
    });

    const latestRisk = await this.prisma.clinicalRiskAssessment.findFirst({
      where: { patientId },
      orderBy: { computedAt: "desc" },
    });

    const recentTimeline = await this.prisma.clinicalTimelineEntry.findMany({
      where: { patientId },
      orderBy: { time: "desc" },
      take: 100,
    });

    const recentGlucose = await this.prisma.glucoseReading.findMany({
      where: { patientId },
      orderBy: { takenAt: "desc" },
      take: 50,
    });

    // ── Build prompt ────────────────────────────────────────────────
    const systemPrompt = `You are the Clinical Intelligence Agent for CarePulse, a diabetes clinical platform.
Your role is to analyze a patient's diabetes data and produce clinical insights.
You NEVER communicate directly with patients. Your output is for clinicians only.

You MUST respond with a single valid JSON object (no markdown, no code fences) with this exact structure:
{
  "patterns": ["string array of detected clinical patterns"],
  "correlations": [{"factor": "string", "effect": "string", "strength": 0.0}],
  "explanations": "string — detailed clinical explanation of findings",
  "aggravatingFactors": ["string array of factors worsening the condition"],
  "confidenceLevel": 0.0,
  "recommendations": ["string array of actionable clinical recommendations"]
}

confidenceLevel must be between 0 and 1.
correlations[].strength must be between 0 and 1.
Base your analysis ONLY on the data provided. Do not invent data.`;

    const userMessage = this.buildAgent1Prompt(
      patient,
      latestSnapshot,
      latestRisk,
      recentTimeline,
      recentGlucose,
    );

    // ── Call LLM or fallback ────────────────────────────────────────
    let parsed: Agent1Result;

    try {
      const response = await this.chatCompletion(systemPrompt, userMessage);

      if (response.source === "fallback") {
        this.logger.warn("Mistral unavailable — using deterministic fallback");
        parsed = this.fallbackAgent1(
          latestSnapshot,
          latestRisk,
          recentGlucose,
        );
      } else {
        parsed = this.parseAgent1Response(response.reply);
      }
    } catch (err) {
      this.logger.error("Agent 1 chat failed", (err as Error).message);
      parsed = this.fallbackAgent1(latestSnapshot, latestRisk, recentGlucose);
    }

    // ── Persist ─────────────────────────────────────────────────────
    const analysis = await this.prisma.clinicalAnalysis.create({
      data: {
        patientId,
        sourceClinicalRiskId: latestRisk?.id ?? null,
        patterns: parsed.patterns as unknown as Prisma.InputJsonValue,
        correlations:
          parsed.correlations as unknown as Prisma.InputJsonValue,
        explanations: parsed.explanations,
        aggravatingFactors:
          parsed.aggravatingFactors.length > 0
            ? (parsed.aggravatingFactors as unknown as Prisma.InputJsonValue)
            : undefined,
        confidenceLevel: parsed.confidenceLevel,
        recommendations:
          parsed.recommendations as unknown as Prisma.InputJsonValue,
        modelUsed: this.mistralModel,
      },
    });

    return analysis;
  }

  private buildAgent1Prompt(
    patient: {
      fullName: string;
      dateOfBirth: Date | null;
      sex: string;
      diabetesType: string;
      heightCm: number | null;
      weightKg: number | null;
    },
    snapshot: {
      avgGlucose: number | null;
      glucoseVariance: number | null;
      timeInRange: number | null;
      hypoEvents: number;
      hyperEvents: number;
      dataCompleteness: number | null;
      anomalyFlags: unknown;
      aiHistorySummary: string | null;
    } | null,
    risk: {
      avgGlucose: number;
      glucoseVariance: number;
      timeInRange: number;
      hypoEvents: number;
      hyperEvents: number;
      mealFrequency: number;
      adherenceScore: number;
      hyperglycemia: number;
      hypoglycemia: number;
      adherence: number;
      lifestyle: number;
      overall: string;
      timelineSummary: string;
    } | null,
    timeline: { time: Date | null; type: string; value: number | null; detail: string | null }[],
    glucose: { value: number; takenAt: Date; source: string }[],
  ): string {
    const age = patient.dateOfBirth
      ? Math.floor(
          (Date.now() - patient.dateOfBirth.getTime()) /
            (365.25 * 24 * 60 * 60 * 1000),
        )
      : "unknown";
    const bmi =
      patient.heightCm && patient.weightKg
        ? (
            patient.weightKg / Math.pow(patient.heightCm / 100, 2)
          ).toFixed(1)
        : "unknown";

    const parts: string[] = [];
    parts.push(`=== PATIENT PROFILE ===`);
    parts.push(`Name: ${patient.fullName}`);
    parts.push(`Age: ${age}, Sex: ${patient.sex}`);
    parts.push(`Diabetes type: ${patient.diabetesType}`);
    parts.push(`BMI: ${bmi}`);

    if (snapshot) {
      parts.push(`\n=== TWIN SNAPSHOT (latest) ===`);
      parts.push(`Average glucose: ${snapshot.avgGlucose} mg/dL`);
      parts.push(`Glucose variance: ${snapshot.glucoseVariance}`);
      parts.push(
        `Time in range: ${((snapshot.timeInRange ?? 0) * 100).toFixed(0)}%`,
      );
      parts.push(`Hypo events: ${snapshot.hypoEvents}`);
      parts.push(`Hyper events: ${snapshot.hyperEvents}`);
      parts.push(
        `Data completeness: ${((snapshot.dataCompleteness ?? 0) * 100).toFixed(0)}%`,
      );
      if (snapshot.anomalyFlags) {
        parts.push(
          `Anomaly flags: ${JSON.stringify(snapshot.anomalyFlags)}`,
        );
      }
      if (snapshot.aiHistorySummary) {
        parts.push(`Local summary: ${snapshot.aiHistorySummary}`);
      }
    }

    if (risk) {
      parts.push(`\n=== CLINICAL RISK ASSESSMENT ===`);
      parts.push(`Overall risk: ${risk.overall}`);
      parts.push(`Hyperglycemia risk: ${risk.hyperglycemia}`);
      parts.push(`Hypoglycemia risk: ${risk.hypoglycemia}`);
      parts.push(`Adherence: ${risk.adherence}`);
      parts.push(`Lifestyle score: ${risk.lifestyle}`);
      parts.push(`Meal frequency: ${risk.mealFrequency}/day`);
      parts.push(`Timeline: ${risk.timelineSummary}`);
    }

    if (glucose.length > 0) {
      parts.push(`\n=== RECENT GLUCOSE READINGS (last 50) ===`);
      for (const g of glucose.slice(0, 20)) {
        parts.push(
          `  ${g.takenAt.toISOString()} — ${g.value} mg/dL (${g.source})`,
        );
      }
    }

    if (timeline.length > 0) {
      parts.push(`\n=== RECENT TIMELINE (last 20 events) ===`);
      for (const t of timeline.slice(0, 20)) {
        parts.push(
          `  ${t.time?.toISOString() ?? "N/A"} — ${t.type}: ${t.value ?? ""} ${t.detail ?? ""}`,
        );
      }
    }

    parts.push(
      `\nAnalyze this patient's diabetes data. Identify patterns, correlations, and provide clinical recommendations.`,
    );

    return parts.join("\n");
  }

  private parseAgent1Response(reply: string): Agent1Result {
    // Try to extract JSON from the reply (may be wrapped in markdown fences)
    let jsonStr = reply.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    return {
      patterns: Array.isArray(parsed.patterns) ? (parsed.patterns as string[]) : [],
      correlations: Array.isArray(parsed.correlations)
        ? (parsed.correlations as { factor: string; effect: string; strength: number }[])
        : [],
      explanations: typeof parsed.explanations === "string" ? parsed.explanations : "",
      aggravatingFactors: Array.isArray(parsed.aggravatingFactors)
        ? (parsed.aggravatingFactors as string[])
        : [],
      confidenceLevel:
        typeof parsed.confidenceLevel === "number"
          ? Math.max(0, Math.min(1, parsed.confidenceLevel))
          : 0.5,
      recommendations: Array.isArray(parsed.recommendations)
        ? (parsed.recommendations as string[])
        : [],
    };
  }

  private fallbackAgent1(
    snapshot: {
      avgGlucose: number | null;
      hypoEvents: number;
      hyperEvents: number;
      timeInRange: number | null;
    } | null,
    risk: { overall: string; hyperglycemia: number; hypoglycemia: number } | null,
    glucose: { value: number }[],
  ): Agent1Result {
    const patterns: string[] = [];
    const correlations: { factor: string; effect: string; strength: number }[] = [];
    const aggravating: string[] = [];
    const recommendations: string[] = [];

    if (snapshot) {
      if (snapshot.hyperEvents > 5)
        patterns.push("Frequent hyperglycemic episodes detected");
      if (snapshot.hypoEvents > 2)
        patterns.push("Recurring hypoglycemic events");
      if ((snapshot.timeInRange ?? 0) < 0.5)
        patterns.push("Time in range below 50% — suboptimal glycemic control");
      if ((snapshot.avgGlucose ?? 0) > 180)
        patterns.push("Persistent elevated average glucose");
    }

    if (risk) {
      if (risk.hyperglycemia > 0.5)
        aggravating.push("High hyperglycemia risk factor");
      if (risk.hypoglycemia > 0.3)
        aggravating.push("Elevated hypoglycemia risk factor");
    }

    if (glucose.length > 10) {
      const vals = glucose.map((g) => g.value);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const highCount = vals.filter((v) => v > 180).length;
      if (highCount / vals.length > 0.4) {
        correlations.push({
          factor: "persistent_hyperglycemia",
          effect: "elevated_avg_glucose",
          strength: 0.7,
        });
      }
    }

    recommendations.push("Review medication dosage with treating physician");
    recommendations.push("Continue glucose monitoring at current frequency");
    if ((snapshot?.timeInRange ?? 1) < 0.5)
      recommendations.push("Consider dietary adjustments to improve time in range");

    return {
      patterns: patterns.length > 0 ? patterns : ["No significant patterns detected with available data"],
      correlations,
      explanations:
        "Analysis based on available clinical data. " +
        (risk?.overall
          ? `Current overall risk level: ${risk.overall}.`
          : "Risk assessment not yet available.") +
        " Further data collection recommended for higher-confidence insights.",
      aggravatingFactors: aggravating,
      confidenceLevel: glucose.length > 20 ? 0.5 : 0.3,
      recommendations,
    };
  }

  // ====================================================================
  // Agent 2 — Care Assistant Agent
  // ====================================================================

  async generateClinicalReport(
    user: AuthUser,
    clinicalAnalysisId: string,
  ) {
    const analysis = await this.prisma.clinicalAnalysis.findUnique({
      where: { id: clinicalAnalysisId },
      select: { patientId: true },
    });
    if (!analysis) throw new NotFoundException("ClinicalAnalysis not found");
    await this.assertCanRead(user, analysis.patientId);
    return this.generateClinicalReportInternal(clinicalAnalysisId);
  }

  /** Internal version for queue workers — skips auth. */
  async generateClinicalReportInternal(clinicalAnalysisId: string) {
    const analysis = await this.prisma.clinicalAnalysis.findUnique({
      where: { id: clinicalAnalysisId },
      include: {
        patient: true,
        sourceClinicalRisk: true,
      },
    });

    if (!analysis) throw new NotFoundException("ClinicalAnalysis not found");

    // ── Build prompt ────────────────────────────────────────────────
    const systemPrompt = `You are the Care Assistant Agent for CarePulse, a diabetes clinical platform.
Your role is to transform clinical intelligence analysis into a clear, actionable clinical report for the treating clinician.
You NEVER invent new clinical analyses. You ONLY reformat and synthesize the analysis produced by the Clinical Intelligence Agent.

You MUST respond with a single valid JSON object (no markdown, no code fences) with this exact structure:
{
  "summary": "string — 2-3 sentence executive summary",
  "fullReport": "string — detailed clinical report in plain language",
  "priorities": ["string array — top clinical priorities, ordered by urgency"],
  "recommendations": ["string array — specific actionable recommendations"],
  "pointsToWatch": ["string array — parameters or events to monitor closely"]
}`;

    const userMessage = this.buildAgent2Prompt(analysis);

    // ── Call LLM or fallback ────────────────────────────────────────
    let parsed: Agent2Result;

    try {
      const response = await this.chatCompletion(systemPrompt, userMessage);

      if (response.source === "fallback") {
        this.logger.warn("Mistral unavailable — using deterministic fallback for report");
        parsed = this.fallbackAgent2(analysis);
      } else {
        parsed = this.parseAgent2Response(response.reply);
      }
    } catch (err) {
      this.logger.error("Agent 2 chat failed", (err as Error).message);
      parsed = this.fallbackAgent2(analysis);
    }

    // ── Persist ─────────────────────────────────────────────────────
    const report = await this.prisma.clinicalReport.create({
      data: {
        patientId: analysis.patientId,
        clinicalAnalysisId: analysis.id,
        summary: parsed.summary,
        fullReport: parsed.fullReport,
        priorities: parsed.priorities as unknown as Prisma.InputJsonValue,
        recommendations:
          parsed.recommendations as unknown as Prisma.InputJsonValue,
        pointsToWatch:
          parsed.pointsToWatch as unknown as Prisma.InputJsonValue,
      },
    });

    return report;
  }

  private buildAgent2Prompt(analysis: {
    patterns: unknown;
    correlations: unknown;
    explanations: string;
    aggravatingFactors: unknown;
    confidenceLevel: number;
    recommendations: unknown;
    patient: { fullName: string; diabetesType: string };
    sourceClinicalRisk: {
      overall: string;
      avgGlucose: number;
      timeInRange: number;
      adherenceScore: number;
      timelineSummary: string;
    } | null;
  }): string {
    const parts: string[] = [];
    parts.push(`=== PATIENT ===`);
    parts.push(`Name: ${analysis.patient.fullName}`);
    parts.push(`Diabetes type: ${analysis.patient.diabetesType}`);

    if (analysis.sourceClinicalRisk) {
      const r = analysis.sourceClinicalRisk;
      parts.push(`\n=== CLINICAL RISK CONTEXT ===`);
      parts.push(`Overall risk: ${r.overall}`);
      parts.push(`Average glucose: ${r.avgGlucose} mg/dL`);
      parts.push(`Time in range: ${(r.timeInRange * 100).toFixed(0)}%`);
      parts.push(`Adherence score: ${r.adherenceScore}`);
      parts.push(`Summary: ${r.timelineSummary}`);
    }

    parts.push(`\n=== CLINICAL INTELLIGENCE ANALYSIS ===`);
    parts.push(`Confidence: ${(analysis.confidenceLevel * 100).toFixed(0)}%`);
    parts.push(`Patterns detected: ${JSON.stringify(analysis.patterns)}`);
    parts.push(`Correlations: ${JSON.stringify(analysis.correlations)}`);
    parts.push(`Explanations: ${analysis.explanations}`);
    if (analysis.aggravatingFactors) {
      parts.push(
        `Aggravating factors: ${JSON.stringify(analysis.aggravatingFactors)}`,
      );
    }
    parts.push(`Recommendations from analysis: ${JSON.stringify(analysis.recommendations)}`);

    parts.push(
      `\nGenerate a clear, structured clinical report based on this analysis.`,
    );

    return parts.join("\n");
  }

  private parseAgent2Response(reply: string): Agent2Result {
    let jsonStr = reply.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      fullReport: typeof parsed.fullReport === "string" ? parsed.fullReport : "",
      priorities: Array.isArray(parsed.priorities)
        ? (parsed.priorities as string[])
        : [],
      recommendations: Array.isArray(parsed.recommendations)
        ? (parsed.recommendations as string[])
        : [],
      pointsToWatch: Array.isArray(parsed.pointsToWatch)
        ? (parsed.pointsToWatch as string[])
        : [],
    };
  }

  private fallbackAgent2(analysis: {
    patterns: unknown;
    explanations: string;
    confidenceLevel: number;
    recommendations: unknown;
    aggravatingFactors: unknown;
    sourceClinicalRisk: {
      overall: string;
      avgGlucose: number;
      timeInRange: number;
      adherenceScore: number;
    } | null;
    patient: { fullName: string };
  }): Agent2Result {
    const risk = analysis.sourceClinicalRisk;
    const riskLabel = risk?.overall ?? "unknown";

    const summary = `Clinical report for ${analysis.patient.fullName}. ` +
      `Overall risk level: ${riskLabel}. ` +
      `Confidence of analysis: ${(analysis.confidenceLevel * 100).toFixed(0)}%.`;

    const fullReport =
      `${analysis.explanations}\n\n` +
      `Risk assessment: ${riskLabel}. ` +
      (risk
        ? `Average glucose: ${risk.avgGlucose} mg/dL, time in range: ${(risk.timeInRange * 100).toFixed(0)}%, adherence: ${risk.adherenceScore}.`
        : "") +
      `\n\nPatterns identified: ${JSON.stringify(analysis.patterns)}.` +
      (analysis.aggravatingFactors
        ? `\nAggravating factors: ${JSON.stringify(analysis.aggravatingFactors)}.`
        : "");

    const priorities: string[] = [];
    if (riskLabel === "high") priorities.push("Urgent clinical review required");
    if ((risk?.timeInRange ?? 1) < 0.5)
      priorities.push("Improve time in range through treatment adjustment");
    if ((risk?.adherenceScore ?? 1) < 0.5)
      priorities.push("Address medication/data adherence gaps");
    if (priorities.length === 0)
      priorities.push("Continue current monitoring plan");

    const recs = Array.isArray(analysis.recommendations)
      ? (analysis.recommendations as string[])
      : ["Review current treatment plan"];
    const watch: string[] = [];
    if ((risk?.avgGlucose ?? 0) > 180) watch.push("Average glucose level");
    if ((risk?.timeInRange ?? 1) < 0.5) watch.push("Time in range metric");
    watch.push("Upcoming lab results");

    return { summary, fullReport, priorities, recommendations: recs, pointsToWatch: watch };
  }

  // ====================================================================
  // History queries
  // ====================================================================

  async getAnalyses(user: AuthUser, patientId: string, page = 1, pageSize = 50) {
    await this.assertCanRead(user, patientId);
    const [data, total] = await Promise.all([
      this.prisma.clinicalAnalysis.findMany({
        where: { patientId },
        orderBy: { generatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.clinicalAnalysis.count({ where: { patientId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async getReports(user: AuthUser, patientId: string, page = 1, pageSize = 50) {
    await this.assertCanRead(user, patientId);
    const [data, total] = await Promise.all([
      this.prisma.clinicalReport.findMany({
        where: { patientId },
        orderBy: { generatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.clinicalReport.count({ where: { patientId } }),
    ]);
    return { data, total, page, pageSize };
  }

  async markReportReviewed(user: AuthUser, reportId: string) {
    if (user.role !== Role.CLINICIAN)
      throw new ForbiddenException("Only clinicians can review reports");

    const report = await this.prisma.clinicalReport.findUnique({
      where: { id: reportId },
      select: { patientId: true },
    });
    if (!report) throw new NotFoundException("ClinicalReport not found");
    await this.assertCanRead(user, report.patientId);

    return this.prisma.clinicalReport.update({
      where: { id: reportId },
      data: {
        reviewedByClinicianId: user.profileId,
        reviewedAt: new Date(),
      },
    });
  }
}
