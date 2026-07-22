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
import { CreateReadingDto } from "./dto/create-reading.dto";
import { AlertsService } from "../alerts/alerts.service";
import { CreateHospitalEncounterDto } from "./dto/create-hospital-encounter.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";

// ── Risk-level string → Prisma enum helpers ──────────────────────────

const ML_RISK_MAP: Record<string, string> = {
  low: "LOW",
  moderate: "MODERATE",
  high: "HIGH",
  very_high: "VERY_HIGH",
};

const CLINICAL_RISK_MAP: Record<string, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

function toMlRiskLevel(raw: string): string {
  return ML_RISK_MAP[raw.toLowerCase()] ?? "MODERATE";
}

function toClinicalOverallRisk(raw: string): string {
  return CLINICAL_RISK_MAP[raw.toLowerCase()] ?? "MEDIUM";
}

// ── Types for Python microservice responses ──────────────────────────

interface PyClinicalRulesResponse {
  timeline: { time: string; type: string; value?: number; detail: string }[];
  stats: {
    avg_glucose: number;
    variance: number;
    time_in_range: number;
    hypo_events: number;
    hyper_events: number;
    meal_frequency: number;
    adherence_score: number;
  };
  risk_assessment: {
    hyperglycemia: number;
    hypoglycemia: number;
    adherence: number;
    lifestyle: number;
    overall: string;
  };
  timeline_summary: string;
}

interface PyPredictResponse {
  risk_score: number;
  risk_level: string;
  model_version: string;
}

interface PyReadmissionResponse {
  risk_score: number;
  risk_level: string;
  model_version: string;
}

@Injectable()
export class TwinService {
  private readonly logger = new Logger(TwinService.name);
  private readonly riskModelUrl: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private alertsService: AlertsService,
  ) {
    this.riskModelUrl = this.config.get<string>(
      "RISK_MODEL_URL",
      "http://localhost:8000",
    );
  }

  // ====================================================================
  // Authorization helpers (same logic as IngestionService)
  // ====================================================================

  private async resolvePatientId(user: AuthUser): Promise<string> {
    if (user.role === Role.PATIENT) return user.profileId;
    throw new ForbiddenException("Only patients can perform this action");
  }

  private async assertCanRead(
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

  private async assertCanWrite(
    user: AuthUser,
    patientId: string,
  ): Promise<void> {
    if (user.role === Role.PATIENT) {
      if (user.profileId !== patientId)
        throw new ForbiddenException("Cannot write to another patient's data");
      return;
    }
    if (user.role === Role.CLINICIAN) {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: { clinicianId: true },
      });
      if (!patient) throw new NotFoundException("Patient not found");
      if (patient.clinicianId !== user.profileId)
        throw new ForbiddenException("Cannot write to a patient not assigned to you");
      return;
    }
    throw new ForbiddenException("Insufficient permissions");
  }

  // ====================================================================
  // Record reading (patient log submission)
  // ====================================================================

  async recordReading(user: AuthUser, patientId: string, dto: CreateReadingDto) {
    await this.assertCanWrite(user, patientId);

    const now = new Date();

    let glucoseReading = null;

    if (dto.value !== undefined && dto.value !== null) {
      glucoseReading = await this.prisma.glucoseReading.create({
        data: {
          patientId,
          value: dto.value,
          source: "MANUAL",
          takenAt: now,
        },
      });
    }

    const events: any[] = [];

    if (dto.mealType) {
      events.push(
        await this.prisma.lifeEvent.create({
          data: {
            patientId,
            type: "MEAL",
            occurredAt: now,
            payload: {
              mealType: dto.mealType,
              mealDescription: dto.mealDescription || "",
            },
          },
        }),
      );
    }

    if (dto.activityType) {
      events.push(
        await this.prisma.lifeEvent.create({
          data: {
            patientId,
            type: "ACTIVITY",
            occurredAt: now,
            payload: {
              activityType: dto.activityType,
              duration: dto.activityDuration || 0,
            },
          },
        }),
      );
    }

    if (dto.symptoms?.length) {
      events.push(
        await this.prisma.lifeEvent.create({
          data: {
            patientId,
            type: "SYMPTOM",
            occurredAt: now,
            payload: {
              symptoms: dto.symptoms,
              observations: dto.observations || "",
            },
          },
        }),
      );
    }

    if (dto.medications) {
      events.push(
        await this.prisma.lifeEvent.create({
          data: {
            patientId,
            type: "MEDICATION_INTAKE",
            occurredAt: now,
            payload: { medications: dto.medications },
          },
        }),
      );
    }

    if (dto.mood) {
      events.push(
        await this.prisma.lifeEvent.create({
          data: {
            patientId,
            type: "MOOD",
            occurredAt: now,
            payload: { mood: dto.mood, observations: dto.observations || "" },
          },
        }),
      );
    }

    return { glucoseReading, lifeEvents: events };
  }

  // ====================================================================
  // Twin snapshot
  // ====================================================================

  /** Build compact twin state from recent data and persist a TwinSnapshot. */
  async buildTwinState(patientId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [glucoseReadings, lifeEvents, medications] = await Promise.all([
      this.prisma.glucoseReading.findMany({
        where: { patientId, takenAt: { gte: thirtyDaysAgo } },
        orderBy: { takenAt: "desc" },
      }),
      this.prisma.lifeEvent.findMany({
        where: { patientId, occurredAt: { gte: thirtyDaysAgo } },
        orderBy: { occurredAt: "desc" },
      }),
      this.prisma.medication.findMany({
        where: { patientId, active: true },
      }),
    ]);

    const glucoseValues = glucoseReadings.map((r) => r.value);

    const avgGlucose =
      glucoseValues.length > 0
        ? glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length
        : null;

    const glucoseVariance =
      glucoseValues.length > 1
        ? glucoseValues.reduce(
            (sum, v) => sum + Math.pow(v - (avgGlucose ?? 0), 2),
            0,
          ) / (glucoseValues.length - 1)
        : null;

    const inRange =
      glucoseValues.length > 0
        ? glucoseValues.filter((v) => v >= 70 && v <= 180).length /
          glucoseValues.length
        : null;

    const hypoEvents = glucoseValues.filter((v) => v < 70).length;
    const hyperEvents = glucoseValues.filter((v) => v > 180).length;

    // Data completeness: expected ~288 CGM readings per day × 30 days
    const expectedReadings = 288 * 30;
    const dataCompleteness =
      glucoseValues.length > 0
        ? Math.min(glucoseValues.length / expectedReadings, 1)
        : 0;

    // Detect data gaps (no readings for >24h)
    const dataGaps: { start: string; end: string }[] = [];
    for (let i = 1; i < glucoseReadings.length; i++) {
      const prev = glucoseReadings[i].takenAt.getTime();
      const curr = glucoseReadings[i - 1].takenAt.getTime();
      const diffHours = (prev - curr) / (1000 * 60 * 60);
      if (diffHours > 24) {
        dataGaps.push({
          start: new Date(prev).toISOString(),
          end: new Date(curr).toISOString(),
        });
      }
    }

    // Anomaly flags
    const anomalyFlags: string[] = [];
    if (hypoEvents > 3) anomalyFlags.push("FREQUENT_HYPO");
    if (hyperEvents > 10) anomalyFlags.push("FREQUENT_HYPER");
    if (dataCompleteness < 0.3) anomalyFlags.push("LOW_DATA_COVERAGE");
    if (glucoseValues.length > 0 && (avgGlucose ?? 0) > 200)
      anomalyFlags.push("PERSISTENT_HYPERGLYCEMIA");

    // Local summary
    const summary = this.buildLocalSummary(
      avgGlucose,
      glucoseVariance,
      inRange,
      hypoEvents,
      hyperEvents,
      dataCompleteness,
    );

    const snapshot = await this.prisma.twinSnapshot.create({
      data: {
        patientId,
        avgGlucose,
        glucoseVariance,
        timeInRange: inRange,
        hypoEvents,
        hyperEvents,
        dataCompleteness,
        dataGaps: dataGaps.length > 0 ? dataGaps : undefined,
        anomalyFlags: anomalyFlags.length > 0 ? anomalyFlags : undefined,
        aiHistorySummary: summary,
      },
    });

    // Persist timeline entries (mirror of ingestion data for audit)
    await this.persistTimelineEntries(
      patientId,
      glucoseReadings,
      lifeEvents,
      medications,
    );

    return snapshot;
  }

  private buildLocalSummary(
    avgGlucose: number | null,
    variance: number | null,
    timeInRange: number | null,
    hypoEvents: number,
    hyperEvents: number,
    dataCompleteness: number,
  ): string {
    const parts: string[] = [];
    if (avgGlucose !== null)
      parts.push(`Average glucose: ${avgGlucose.toFixed(1)} mg/dL.`);
    if (variance !== null) parts.push(`Variance: ${variance.toFixed(1)}.`);
    if (timeInRange !== null)
      parts.push(`Time in range: ${(timeInRange * 100).toFixed(0)}%.`);
    parts.push(`${hypoEvents} hypo, ${hyperEvents} hyper events.`);
    parts.push(
      `Data completeness: ${(dataCompleteness * 100).toFixed(0)}%.`,
    );
    return parts.join(" ");
  }

  private async persistTimelineEntries(
    patientId: string,
    glucoseReadings: { takenAt: Date; value: number; source: string }[],
    lifeEvents: {
      occurredAt: Date;
      type: string;
      payload: Prisma.JsonValue;
    }[],
    medications: { name: string; dosage: string; createdAt: Date }[],
  ) {
    const entries: Prisma.ClinicalTimelineEntryCreateManyInput[] = [];

    for (const r of glucoseReadings) {
      entries.push({
        patientId,
        time: r.takenAt,
        type: "glucose",
        value: r.value,
        detail: `${r.source} reading`,
      });
    }

    for (const e of lifeEvents) {
      entries.push({
        patientId,
        time: e.occurredAt,
        type: e.type.toLowerCase(),
        detail:
          typeof e.payload === "object" && e.payload !== null
            ? JSON.stringify(e.payload)
            : undefined,
      });
    }

    for (const m of medications) {
      entries.push({
        patientId,
        time: m.createdAt,
        type: "medication",
        detail: `${m.name} ${m.dosage}`,
      });
    }

    if (entries.length > 0) {
      await this.prisma.clinicalTimelineEntry.createMany({ data: entries });
    }
  }

  // ====================================================================
  // Get latest twin snapshot
  // ====================================================================

  async getLatestSnapshot(user: AuthUser, patientId?: string) {
    const pid = patientId ?? user.profileId;
    await this.assertCanRead(user, pid);

    const snapshot = await this.prisma.twinSnapshot.findFirst({
      where: { patientId: pid },
      orderBy: { generatedAt: "desc" },
    });

    if (!snapshot) {
      return {
        id: null,
        patientId: pid,
        generatedAt: null,
        avgGlucose: null,
        glucoseVariance: null,
        timeInRange: null,
        hypoEvents: 0,
        hyperEvents: 0,
        dataCompleteness: null,
        dataGaps: null,
        anomalyFlags: null,
        aiHistorySummary: null,
        cleanedReadings: [],
        stats: {
          avgGlucose: null,
          timeInRange: null,
          hypoEvents: 0,
          hyperEvents: 0,
          totalReadings: 0,
        },
      };
    }
    return snapshot;
  }

  // ====================================================================
  // Python microservice client
  // ====================================================================

  private async pyPost<T>(
    path: string,
    body: unknown,
  ): Promise<T> {
    const url = `${this.riskModelUrl}${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      this.logger.warn(
        `Python microservice ${path} returned ${res.status}: ${text}`,
      );
      throw new Error(`Risk model service error (${res.status})`);
    }

    return res.json() as Promise<T>;
  }

  // ── Clinical rules ────────────────────────────────────────────────

  async callClinicalRules(patientId: string) {
    const [glucoseReadings, lifeEvents, medications, labResults] =
      await Promise.all([
        this.prisma.glucoseReading.findMany({
          where: { patientId },
          orderBy: { takenAt: "desc" },
          take: 500,
        }),
        this.prisma.lifeEvent.findMany({
          where: { patientId },
          orderBy: { occurredAt: "desc" },
          take: 200,
        }),
        this.prisma.medication.findMany({
          where: { patientId, active: true },
        }),
        this.prisma.labResult.findMany({
          where: { patientId },
          orderBy: { takenAt: "desc" },
          take: 100,
        }),
      ]);

    const payload = {
      patient_id: patientId,
      readings: glucoseReadings.map((r) => ({
        value: r.value,
        timestamp: r.takenAt.toISOString(),
        source: r.source.toLowerCase(),
      })),
      events: lifeEvents.map((e) => ({
        type: e.type.toLowerCase(),
        timestamp: e.occurredAt.toISOString(),
        metadata:
          typeof e.payload === "object" && e.payload !== null
            ? e.payload
            : undefined,
      })),
      medications: medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
      })),
      lab_results: labResults.map((lr) => ({
        name: lr.name,
        value: lr.value,
        unit: lr.unit,
      })),
    };

    let result: PyClinicalRulesResponse;
    try {
      result = await this.pyPost<PyClinicalRulesResponse>(
        "/clinical-rules",
        payload,
      );
    } catch (err) {
      this.logger.error("clinical-rules call failed", (err as Error).message);
      throw err;
    }

    const assessment = await this.prisma.clinicalRiskAssessment.create({
      data: {
        patientId,
        avgGlucose: result.stats.avg_glucose,
        glucoseVariance: result.stats.variance,
        timeInRange: result.stats.time_in_range,
        hypoEvents: result.stats.hypo_events,
        hyperEvents: result.stats.hyper_events,
        mealFrequency: result.stats.meal_frequency,
        adherenceScore: result.stats.adherence_score,
        hyperglycemia: result.risk_assessment.hyperglycemia,
        hypoglycemia: result.risk_assessment.hypoglycemia,
        adherence: result.risk_assessment.adherence,
        lifestyle: result.risk_assessment.lifestyle,
        overall: toClinicalOverallRisk(
          result.risk_assessment.overall,
        ) as any,
        timelineSummary: result.timeline_summary,
      },
    });

    // Auto-generate alerts for non-LOW risk
    try {
      await this.alertsService.evaluateAndNotify(assessment.id);
    } catch (err) {
      this.logger.warn(
        `Alert generation failed for assessment ${assessment.id}: ${(err as Error).message}`,
      );
    }

    return assessment;
  }

  // ── Diabetes screening ────────────────────────────────────────────

  async callDiabetesScreening(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException("Patient not found");

    // Build Pima-style features from available patient data
    // Use defaults of 0 for missing clinical measurements
    const payload = {
      pregnancies: 0,
      glucose: patient.weightKg ? Math.round(patient.weightKg) : 0,
      blood_pressure: 0,
      skin_thickness: 0,
      insulin: 0,
      bmi: patient.weightKg && patient.heightCm
        ? Math.round(
            (patient.weightKg / Math.pow(patient.heightCm / 100, 2)) * 10,
          ) / 10
        : 0,
      diabetes_pedigree_function: 0,
      age: patient.dateOfBirth
        ? Math.floor(
            (Date.now() - patient.dateOfBirth.getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : 0,
    };

    let result: PyPredictResponse;
    try {
      result = await this.pyPost<PyPredictResponse>("/predict", payload);
    } catch (err) {
      this.logger.error("predict call failed", (err as Error).message);
      throw err;
    }

    const score = await this.prisma.diabetesRiskScore.create({
      data: {
        patientId,
        riskScore: result.risk_score,
        riskLevel: toMlRiskLevel(result.risk_level) as any,
        modelVersion: result.model_version,
        inputFeatures: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return score;
  }

  // ── Hospital encounter + readmission scoring ──────────────────────

  async createHospitalEncounter(
    user: AuthUser,
    patientId: string,
    dto: CreateHospitalEncounterDto,
  ) {
    await this.assertCanRead(user, patientId);

    return this.prisma.hospitalEncounter.create({
      data: {
        patientId,
        admissionTypeId: dto.admissionTypeId,
        dischargeDispositionId: dto.dischargeDispositionId,
        admissionSourceId: dto.admissionSourceId,
        timeInHospital: dto.timeInHospital,
        numLabProcedures: dto.numLabProcedures,
        numProcedures: dto.numProcedures,
        numMedications: dto.numMedications,
        numberOutpatient: dto.numberOutpatient,
        numberEmergency: dto.numberEmergency,
        numberInpatient: dto.numberInpatient,
        diag1: dto.diag1,
        diag2: dto.diag2,
        diag3: dto.diag3,
        numberDiagnoses: dto.numberDiagnoses,
        maxGluSerum: dto.maxGluSerum,
        a1cResult: dto.a1cResult,
        changeMade: dto.changeMade,
        diabetesMed: dto.diabetesMed,
        readmitted: dto.readmitted,
        medicationStatus: dto.medicationStatus as unknown as Prisma.InputJsonValue,
        admittedAt: dto.admittedAt ? new Date(dto.admittedAt) : undefined,
        dischargedAt: dto.dischargedAt ? new Date(dto.dischargedAt) : undefined,
      },
    });
  }

  async callReadmissionScoring(encounterId: string) {
    const encounter = await this.prisma.hospitalEncounter.findUnique({
      where: { id: encounterId },
    });
    if (!encounter)
      throw new NotFoundException("Hospital encounter not found");

    const payload = {
      age: undefined as number | undefined,
      race: undefined as string | undefined,
      gender: undefined as string | undefined,
      admission_type_id: encounter.admissionTypeId,
      discharge_disposition_id: encounter.dischargeDispositionId,
      admission_source_id: encounter.admissionSourceId,
      time_in_hospital: encounter.timeInHospital,
      num_lab_procedures: encounter.numLabProcedures,
      num_procedures: encounter.numProcedures,
      num_medications: encounter.numMedications,
      number_outpatient: encounter.numberOutpatient,
      number_emergency: encounter.numberEmergency,
      number_inpatient: encounter.numberInpatient,
      diag_1: encounter.diag1,
      diag_2: encounter.diag2,
      diag_3: encounter.diag3,
      number_diagnoses: encounter.numberDiagnoses,
      max_glu_serum: encounter.maxGluSerum,
      a1c_result: encounter.a1cResult,
      change: encounter.changeMade,
      diabetes_med: encounter.diabetesMed ? "Yes" : "No",
    };

    // Resolve age/gender from patient
    const patient = await this.prisma.patient.findUnique({
      where: { id: encounter.patientId },
      select: { dateOfBirth: true, sex: true },
    });
    if (patient?.dateOfBirth) {
      payload.age = Math.floor(
        (Date.now() - patient.dateOfBirth.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
    }
    if (patient?.sex) {
      payload.gender = patient.sex === "MALE" ? "Male" : "Female";
    }

    let result: PyReadmissionResponse;
    try {
      result = await this.pyPost<PyReadmissionResponse>(
        "/readmission/predict",
        payload,
      );
    } catch (err) {
      this.logger.error(
        "readmission/predict call failed",
        (err as Error).message,
      );
      throw err;
    }

    const score = await this.prisma.readmissionRiskScore.create({
      data: {
        patientId: encounter.patientId,
        hospitalEncounterId: encounterId,
        riskScore: result.risk_score,
        riskLevel: toMlRiskLevel(result.risk_level) as any,
        modelVersion: result.model_version,
        inputFeatures: payload as unknown as Prisma.InputJsonValue,
      },
    });

    return score;
  }

  // ====================================================================
  // History queries (paginated by date)
  // ====================================================================

  async getHospitalEncounters(
    user: AuthUser,
    patientId: string,
    query: PaginationQueryDto,
  ) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.admittedAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.hospitalEncounter.findMany({
        where,
        orderBy: { admittedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.hospitalEncounter.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async getDiabetesRiskScores(
    user: AuthUser,
    patientId: string,
    query: PaginationQueryDto,
  ) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.computedAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.diabetesRiskScore.findMany({
        where,
        orderBy: { computedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.diabetesRiskScore.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async getReadmissionRiskScores(
    user: AuthUser,
    patientId: string,
    query: PaginationQueryDto,
  ) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.computedAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.readmissionRiskScore.findMany({
        where,
        orderBy: { computedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.readmissionRiskScore.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  async getClinicalRiskAssessments(
    user: AuthUser,
    patientId: string,
    query: PaginationQueryDto,
  ) {
    await this.assertCanRead(user, patientId);
    const { page = 1, pageSize = 50, from, to } = query;
    const where: Record<string, unknown> = { patientId };
    if (from || to) {
      where.computedAt = {
        ...(from && { gte: new Date(from) }),
        ...(to && { lte: new Date(to) }),
      };
    }
    const [data, total] = await Promise.all([
      this.prisma.clinicalRiskAssessment.findMany({
        where,
        orderBy: { computedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.clinicalRiskAssessment.count({ where }),
    ]);
    return { data, total, page, pageSize };
  }

  // ====================================================================
  // Full refresh chain
  // ====================================================================

  async refreshPatient(user: AuthUser, patientId: string) {
    await this.assertCanRead(user, patientId);
    return this.refreshPatientInternal(patientId);
  }

  /** Internal version for queue workers — skips auth. */
  async refreshPatientInternal(patientId: string) {
    const snapshot = await this.buildTwinState(patientId);

    let clinicalRisk = null;
    let diabetesScore = null;

    try {
      clinicalRisk = await this.callClinicalRules(patientId);
    } catch {
      this.logger.warn(
        `clinical-rules failed for patient ${patientId} — continuing`,
      );
    }

    try {
      diabetesScore = await this.callDiabetesScreening(patientId);
    } catch {
      this.logger.warn(
        `diabetes screening failed for patient ${patientId} — continuing`,
      );
    }

    return { snapshot, clinicalRisk, diabetesScore };
  }
}
