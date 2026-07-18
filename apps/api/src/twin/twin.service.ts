import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TwinService {
  constructor(private prisma: PrismaService) {}

  async buildTwinState(patientId: string, days: number = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);

    const [readings, events] = await Promise.all([
      this.prisma.glucoseReading.findMany({
        where: { patientId, timestamp: { gte: since } },
        orderBy: { timestamp: "asc" },
      }),
      this.prisma.lifeEvent.findMany({
        where: { patientId, timestamp: { gte: since } },
        orderBy: { timestamp: "asc" },
      }),
    ]);

    const gaps = this.detectGaps(readings);
    const stats = this.computeStats(readings);
    const cleanedReadings = readings.map((r) => ({
      id: r.id,
      value: r.value,
      timestamp: r.timestamp.toISOString(),
      source: r.source as "cgm" | "manual",
      isAnomaly: r.value < 54 || r.value > 400,
      anomalyReason:
        r.value < 54
          ? "severe_hypo"
          : r.value > 400
            ? "severe_hyper"
            : undefined,
    }));

    return {
      patientId,
      cleanedReadings,
      gapsDetected: gaps,
      dataQualityScore: this.computeQualityScore(readings, gaps, days),
      stats,
      lastUpdated: new Date().toISOString(),
    };
  }

  private detectGaps(readings: { timestamp: Date }[]) {
    if (readings.length < 2) return [];

    const gaps: { start: string; end: string; reason: string }[] = [];
    const gapThresholdMinutes = 30;

    for (let i = 1; i < readings.length; i++) {
      const prev = new Date(readings[i - 1].timestamp);
      const curr = new Date(readings[i].timestamp);
      const diffMinutes =
        (curr.getTime() - prev.getTime()) / (1000 * 60);

      if (diffMinutes > gapThresholdMinutes) {
        gaps.push({
          start: prev.toISOString(),
          end: curr.toISOString(),
          reason: diffMinutes > 120 ? "extended_gap" : "sensor_gap",
        });
      }
    }
    return gaps;
  }

  private computeStats(readings: { value: number }[]) {
    if (readings.length === 0) {
      return {
        avgGlucose: 0,
        timeInRange: 0,
        hypoEvents: 0,
        hyperEvents: 0,
        totalReadings: 0,
      };
    }

    const values = readings.map((r) => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const inRange = values.filter((v) => v >= 70 && v <= 180).length;
    const hypos = values.filter((v) => v < 70).length;
    const hypers = values.filter((v) => v > 180).length;

    return {
      avgGlucose: Math.round(avg),
      timeInRange: Number((inRange / values.length).toFixed(3)),
      hypoEvents: hypos,
      hyperEvents: hypers,
      totalReadings: values.length,
    };
  }

  private computeQualityScore(
    readings: any[],
    gaps: any[],
    days: number
  ): number {
    const expectedReadings = days * 288;
    const completeness = Math.min(readings.length / expectedReadings, 1);
    const gapPenalty = gaps.length * 0.05;
    return Number(Math.max(0, completeness - gapPenalty).toFixed(2));
  }
}
