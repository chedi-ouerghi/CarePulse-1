import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface RiskPrediction {
  riskScore: number;
  riskLevel: string;
  modelVersion?: string;
}

export interface ReadmissionPrediction {
  riskScore: number;
  riskLevel: string;
  modelVersion?: string;
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get("RISK_MODEL_URL", "http://localhost:8000");
  }

  async predict(patient: {
    pregnancies: number;
    glucose: number;
    bloodPressure: number;
    skinThickness: number;
    insulin: number;
    bmi: number;
    diabetesPedigreeFunction: number;
    age: number;
  }): Promise<RiskPrediction> {
    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pregnancies: patient.pregnancies,
          glucose: patient.glucose,
          blood_pressure: patient.bloodPressure,
          skin_thickness: patient.skinThickness,
          insulin: patient.insulin,
          bmi: patient.bmi,
          diabetes_pedigree_function: patient.diabetesPedigreeFunction,
          age: patient.age,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Risk model returned ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (err) {
      this.logger.error(`Risk prediction failed: ${err}`);
      if (err instanceof ServiceUnavailableException) throw err;
      throw new ServiceUnavailableException(
        "Risk model service is unavailable"
      );
    }
  }

  async batchPredict(
    patients: Array<{
      pregnancies: number;
      glucose: number;
      bloodPressure: number;
      skinThickness: number;
      insulin: number;
      bmi: number;
      diabetesPedigreeFunction: number;
      age: number;
    }>
  ): Promise<{ results: RiskPrediction[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/batch-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patients: patients.map((p) => ({
            pregnancies: p.pregnancies,
            glucose: p.glucose,
            blood_pressure: p.bloodPressure,
            skin_thickness: p.skinThickness,
            insulin: p.insulin,
            bmi: p.bmi,
            diabetes_pedigree_function: p.diabetesPedigreeFunction,
            age: p.age,
          })),
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Risk model batch returned ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (err) {
      this.logger.error(`Batch risk prediction failed: ${err}`);
      throw new ServiceUnavailableException(
        "Risk model service is unavailable"
      );
    }
  }

  private buildFallbackReadmissionPrediction(patient: Record<string, unknown>): ReadmissionPrediction {
    const age = Number(patient.age ?? 60) || 60;
    const timeInHospital = Number(patient.time_in_hospital ?? 0) || 0;
    const numProcedures = Number(patient.num_procedures ?? 0) || 0;
    const numMedications = Number(patient.num_medications ?? 0) || 0;
    const numberEmergency = Number(patient.number_emergency ?? 0) || 0;
    const numberInpatient = Number(patient.number_inpatient ?? 0) || 0;
    const numberDiagnoses = Number(patient.number_diagnoses ?? 0) || 0;

    const rawScore =
      0.16 +
      age / 300 +
      timeInHospital / 60 +
      numProcedures / 25 +
      numMedications / 100 +
      numberEmergency / 10 +
      numberInpatient / 10 +
      numberDiagnoses / 50;

    const riskScore = Math.max(0.08, Math.min(0.95, rawScore));
    const riskLevel = riskScore >= 0.7 ? "high" : riskScore >= 0.4 ? "moderate" : "low";

    return {
      riskScore,
      riskLevel,
      modelVersion: "fallback-heuristic-v1",
    };
  }

  async predictReadmission(patient: Record<string, unknown>): Promise<ReadmissionPrediction> {
    try {
      const response = await fetch(`${this.baseUrl}/readmission/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Readmission model returned ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (err) {
      this.logger.warn(`Readmission prediction unavailable, using fallback heuristic: ${err}`);
      return this.buildFallbackReadmissionPrediction(patient);
    }
  }

  async batchPredictReadmission(patients: Record<string, unknown>[]): Promise<{ results: ReadmissionPrediction[]; count: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/readmission/batch-predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patients }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Readmission batch returned ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (err) {
      this.logger.warn(`Readmission batch prediction unavailable, using fallback heuristics: ${err}`);
      return {
        results: patients.map((patient) => this.buildFallbackReadmissionPrediction(patient)),
        count: patients.length,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) return false;
      const data = (await response.json()) as { status: string; model_loaded: boolean };
      return data.status === "ok" && data.model_loaded;
    } catch {
      return false;
    }
  }
}
