import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { parse } from "csv-parse/sync";

export interface RawCGMRow {
  timestamp: string;
  value: number;
  source?: string;
}

export interface RawLifeEventRow {
  timestamp: string;
  type: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class IngestionService {
  constructor(private prisma: PrismaService) {}

  async ingestCSV(
    patientId: string,
    fileBuffer: Buffer,
    fileType: "glucose" | "events"
  ) {
    const content = fileBuffer.toString("utf-8");
    let records: any[];

    try {
      records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      throw new BadRequestException("Invalid CSV format");
    }

    if (fileType === "glucose") {
      return this.ingestGlucoseRecords(patientId, records);
    } else {
      return this.ingestEventRecords(patientId, records);
    }
  }

  async ingestJSON(
    patientId: string,
    fileBuffer: Buffer,
    fileType: "glucose" | "events"
  ) {
    let data: any;
    try {
      data = JSON.parse(fileBuffer.toString("utf-8"));
    } catch {
      throw new BadRequestException("Invalid JSON format");
    }

    const records = Array.isArray(data) ? data : data.readings || data.events || [];
    if (fileType === "glucose") {
      return this.ingestGlucoseRecords(patientId, records);
    } else {
      return this.ingestEventRecords(patientId, records);
    }
  }

  private async ingestGlucoseRecords(
    patientId: string,
    records: any[]
  ) {
    const readings = records
      .filter((r) => r.timestamp && r.value)
      .map((r) => ({
        patientId,
        timestamp: new Date(r.timestamp),
        value: parseInt(r.value, 10),
        source: r.source || "cgm",
      }))
      .filter((r) => !isNaN(r.value) && r.value > 0);

    if (readings.length === 0) {
      throw new BadRequestException("No valid glucose readings found");
    }

    const result = await this.prisma.glucoseReading.createMany({
      data: readings,
      skipDuplicates: false,
    });

    return {
      ingested: result.count,
      type: "glucose",
      patientId,
    };
  }

  private async ingestEventRecords(
    patientId: string,
    records: any[]
  ) {
    const events = records
      .filter((r) => r.timestamp && r.type)
      .map((r) => ({
        patientId,
        timestamp: new Date(r.timestamp),
        type: r.type,
        metadata: r.metadata || {},
      }));

    if (events.length === 0) {
      throw new BadRequestException("No valid life events found");
    }

    const result = await this.prisma.lifeEvent.createMany({
      data: events,
      skipDuplicates: false,
    });

    return {
      ingested: result.count,
      type: "events",
      patientId,
    };
  }

  async getPatientDataSummary(patientId: string, days: number = 14) {
    const since = new Date();
    since.setDate(since.getDate() - days);

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

    return { readings, events, days };
  }
}
