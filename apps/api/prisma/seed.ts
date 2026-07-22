/**
 * CarePulse — Database seed script
 *
 * Creates:
 *   1 demo clinician (Dr. Sarah Martin)
 *   3 demo patients with realistic diabetes history:
 *     - Alice Dupont (Type 2, well-controlled)
 *     - Marcus Chen (Type 1, high-risk / frequent hypo)
 *     - Fatima Al-Rashid (Type 2, recent hospitalization)
 *
 * Each patient gets: glucose readings, life events, medications,
 * and lab results spanning the last 30 days.
 */

import { PrismaClient, Role, DiabetesType, Sex, ReadingSource, LifeEventType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomGlucose(base: number, variance: number): number {
  return Math.round((base + (Math.random() - 0.5) * variance * 2) * 10) / 10;
}

function randomHour(hoursAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - hoursAgo);
  d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
  return d;
}

async function main() {
  console.log("Seeding CarePulse database...");

  // Clean existing data (order matters due to FK constraints)
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog",
      "TaskTracker",
      "AlertNotification",
      "Alert",
      "ClinicalReport",
      "ClinicalAnalysis",
      "ReadmissionRiskScore",
      "HospitalEncounter",
      "DiabetesRiskScore",
      "ClinicalRiskAssessment",
      "ClinicalTimelineEntry",
      "TwinSnapshot",
      "Message",
      "Conversation",
      "MessagingChannelAccount",
      "Consent",
      "LabResult",
      "Medication",
      "LifeEvent",
      "GlucoseReading",
      "Patient",
      "Clinician",
      "RefreshToken",
      "User"
    CASCADE
  `);

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // ── Clinician ────────────────────────────────────────────────────
  const clinicianUser = await prisma.user.create({
    data: {
      email: "dr.martin@carepulse.demo",
      passwordHash,
      role: Role.CLINICIAN,
      clinician: {
        create: {
          fullName: "Dr. Sarah Martin",
          licenseNumber: "FR-MED-12345",
          specialty: "Endocrinology",
          hospitalOrClinic: "Hôpital Universitaire de Paris",
        },
      },
    },
    include: { clinician: true },
  });
  const clinician = clinicianUser.clinician!;
  console.log(`  ✓ Clinician: Dr. Sarah Martin (${clinician.id})`);

  // ── Patient 1: Alice Dupont (Type 2, well-controlled) ────────────
  const aliceUser = await prisma.user.create({
    data: {
      email: "alice.dupont@carepulse.demo",
      passwordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          fullName: "Alice Dupont",
          diabetesType: DiabetesType.TYPE_2,
          sex: Sex.FEMALE,
          dateOfBirth: daysAgo(365 * 58),
          heightCm: 162,
          weightKg: 71,
          clinicianId: clinician.id,
        },
      },
    },
    include: { patient: true },
  });
  const alice = aliceUser.patient!;

  // Glucose readings: 30 days, well-controlled (avg ~130)
  for (let day = 30; day >= 0; day--) {
    const readingsPerDay = 3 + Math.floor(Math.random() * 2);
    for (let r = 0; r < readingsPerDay; r++) {
      await prisma.glucoseReading.create({
        data: {
          patientId: alice.id,
          value: randomGlucose(130, 25),
          source: r === 0 ? ReadingSource.CGM : ReadingSource.GLUCOMETER,
          takenAt: randomHour(day * 24),
        },
      });
    }
  }

  // Life events
  for (let day = 30; day >= 0; day--) {
    await prisma.lifeEvent.create({
      data: {
        patientId: alice.id,
        type: LifeEventType.MEAL,
        occurredAt: randomHour(day * 24 + 8),
        payload: JSON.stringify({ mealType: "lunch", carbs: 45, description: "Salade poulet complet" }),
      },
    });
    if (day % 3 === 0) {
      await prisma.lifeEvent.create({
        data: {
          patientId: alice.id,
          type: LifeEventType.ACTIVITY,
          occurredAt: randomHour(day * 24 + 16),
          payload: JSON.stringify({ activityType: "walking", durationMin: 30, intensity: "moderate" }),
        },
      });
    }
  }

  // Medications
  await prisma.medication.create({
    data: {
      patientId: alice.id,
      name: "Metformine",
      dosage: "1000mg",
      frequency: "2x/jour",
      startDate: daysAgo(365),
      prescribedBy: "Dr. Sarah Martin",
      active: true,
    },
  });

  // Lab results
  await prisma.labResult.create({
    data: { patientId: alice.id, name: "HbA1c", value: 6.8, unit: "%", takenAt: daysAgo(14) },
  });
  await prisma.labResult.create({
    data: { patientId: alice.id, name: "Créatinine", value: 0.9, unit: "mg/dL", takenAt: daysAgo(14) },
  });

  console.log(`  ✓ Patient: Alice Dupont (${alice.id}) — 30 days of data`);

  // ── Patient 2: Marcus Chen (Type 1, high-risk) ──────────────────
  const marcusUser = await prisma.user.create({
    data: {
      email: "marcus.chen@carepulse.demo",
      passwordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          fullName: "Marcus Chen",
          diabetesType: DiabetesType.TYPE_1,
          sex: Sex.MALE,
          dateOfBirth: daysAgo(365 * 34),
          heightCm: 178,
          weightKg: 82,
          clinicianId: clinician.id,
        },
      },
    },
    include: { patient: true },
  });
  const marcus = marcusUser.patient!;

  // Glucose readings: 30 days, volatile with frequent hypo/hyper
  for (let day = 30; day >= 0; day--) {
    const readingsPerDay = 4 + Math.floor(Math.random() * 3);
    for (let r = 0; r < readingsPerDay; r++) {
      // High variance, frequent lows and highs
      const isLow = Math.random() < 0.15;
      const isHigh = Math.random() < 0.2;
      const value = isLow
        ? randomGlucose(58, 12)
        : isHigh
          ? randomGlucose(260, 40)
          : randomGlucose(165, 50);
      await prisma.glucoseReading.create({
        data: {
          patientId: marcus.id,
          value: Math.max(40, Math.min(400, value)),
          source: ReadingSource.CGM,
          takenAt: randomHour(day * 24),
        },
      });
    }
  }

  // Life events — stress and poor sleep
  for (let day = 30; day >= 0; day--) {
    await prisma.lifeEvent.create({
      data: {
        patientId: marcus.id,
        type: LifeEventType.MEAL,
        occurredAt: randomHour(day * 24 + 12),
        payload: JSON.stringify({ mealType: "dinner", carbs: 80, description: "Pâtes sauce bolognaise" }),
      },
    });
    if (day % 2 === 0) {
      await prisma.lifeEvent.create({
        data: {
          patientId: marcus.id,
          type: LifeEventType.STRESS,
          occurredAt: randomHour(day * 24 + 20),
          payload: JSON.stringify({ level: "high", description: "Deadline projet travail" }),
        },
      });
    }
    if (day % 3 === 0) {
      await prisma.lifeEvent.create({
        data: {
          patientId: marcus.id,
          type: LifeEventType.SLEEP,
          occurredAt: randomHour(day * 24 + 7),
          payload: JSON.stringify({ hours: 5, quality: "poor" }),
        },
      });
    }
  }

  // Medications
  await prisma.medication.create({
    data: {
      patientId: marcus.id,
      name: "Insuline Lantus",
      dosage: "24U",
      frequency: "1x/jour",
      startDate: daysAgo(365 * 5),
      prescribedBy: "Dr. Sarah Martin",
      active: true,
    },
  });
  await prisma.medication.create({
    data: {
      patientId: marcus.id,
      name: "Insuline NovoRapid",
      dosage: "variable",
      frequency: "à chaque repas",
      startDate: daysAgo(365 * 5),
      prescribedBy: "Dr. Sarah Martin",
      active: true,
    },
  });

  // Lab results
  await prisma.labResult.create({
    data: { patientId: marcus.id, name: "HbA1c", value: 9.2, unit: "%", takenAt: daysAgo(7) },
  });
  await prisma.labResult.create({
    data: { patientId: marcus.id, name: "Cholestérol total", value: 245, unit: "mg/dL", takenAt: daysAgo(7) },
  });

  console.log(`  ✓ Patient: Marcus Chen (${marcus.id}) — high-risk, volatile data`);

  // ── Patient 3: Fatima Al-Rashid (Type 2, recent hospitalization) ─
  const fatimaUser = await prisma.user.create({
    data: {
      email: "fatima.alrashid@carepulse.demo",
      passwordHash,
      role: Role.PATIENT,
      patient: {
        create: {
          fullName: "Fatima Al-Rashid",
          diabetesType: DiabetesType.TYPE_2,
          sex: Sex.FEMALE,
          dateOfBirth: daysAgo(365 * 64),
          heightCm: 155,
          weightKg: 88,
          clinicianId: clinician.id,
        },
      },
    },
    include: { patient: true },
  });
  const fatima = fatimaUser.patient!;

  // Glucose readings: 30 days, moderate control with post-hospitalization improvement
  for (let day = 30; day >= 0; day--) {
    const readingsPerDay = 2 + Math.floor(Math.random() * 2);
    const base = day > 15 ? 200 : 160; // improved after hospital discharge
    for (let r = 0; r < readingsPerDay; r++) {
      await prisma.glucoseReading.create({
        data: {
          patientId: fatima.id,
          value: randomGlucose(base, 30),
          source: ReadingSource.GLUCOMETER,
          takenAt: randomHour(day * 24),
        },
      });
    }
  }

  // Life events
  for (let day = 30; day >= 0; day--) {
    if (day % 2 === 0) {
      await prisma.lifeEvent.create({
        data: {
          patientId: fatima.id,
          type: LifeEventType.MEAL,
          occurredAt: randomHour(day * 24 + 12),
          payload: JSON.stringify({ mealType: "lunch", carbs: 60, description: "Couscous avec légumes" }),
        },
      });
    }
    if (day > 14 && day < 20) {
      await prisma.lifeEvent.create({
        data: {
          patientId: fatima.id,
          type: LifeEventType.SYMPTOM,
          occurredAt: randomHour(day * 24 + 14),
          payload: JSON.stringify({ description: "Fatigue, vertiges", severity: "moderate" }),
        },
      });
    }
  }

  // Medications
  await prisma.medication.create({
    data: {
      patientId: fatima.id,
      name: "Metformine",
      dosage: "850mg",
      frequency: "2x/jour",
      startDate: daysAgo(365 * 3),
      prescribedBy: "Dr. Sarah Martin",
      active: true,
    },
  });
  await prisma.medication.create({
    data: {
      patientId: fatima.id,
      name: "Gliclazide",
      dosage: "80mg",
      frequency: "1x/jour",
      startDate: daysAgo(30),
      prescribedBy: "Dr. Sarah Martin",
      active: true,
    },
  });

  // Lab results
  await prisma.labResult.create({
    data: { patientId: fatima.id, name: "HbA1c", value: 8.5, unit: "%", takenAt: daysAgo(20) },
  });
  await prisma.labResult.create({
    data: { patientId: fatima.id, name: "HbA1c", value: 7.9, unit: "%", takenAt: daysAgo(5) },
  });
  await prisma.labResult.create({
    data: { patientId: fatima.id, name: "Créatinine", value: 1.2, unit: "mg/dL", takenAt: daysAgo(5) },
  });

  // Hospital encounter (recent)
  await prisma.hospitalEncounter.create({
    data: {
      patientId: fatima.id,
      timeInHospital: 5,
      numLabProcedures: 22,
      numProcedures: 2,
      numMedications: 10,
      numberOutpatient: 0,
      numberEmergency: 1,
      numberInpatient: 1,
      numberDiagnoses: 7,
      admittedAt: daysAgo(21),
      dischargedAt: daysAgo(16),
    },
  });

  console.log(`  ✓ Patient: Fatima Al-Rashid (${fatima.id}) — post-hospitalization`);

  console.log("\nSeed complete!");
  console.log("\nDemo credentials (all passwords: demo1234):");
  console.log("  Clinician: dr.martin@carepulse.demo");
  console.log("  Patient 1: alice.dupont@carepulse.demo (Type 2, controlled)");
  console.log("  Patient 2: marcus.chen@carepulse.demo (Type 1, high-risk)");
  console.log("  Patient 3: fatima.alrashid@carepulse.demo (Type 2, post-hospital)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
