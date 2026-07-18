"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function generateGlucoseData(patientId, days = 30) {
    const readings = [];
    const now = new Date();
    for (let day = days; day >= 0; day--) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        const readingsPerDay = 20 + Math.floor(Math.random() * 8);
        for (let r = 0; r < readingsPerDay; r++) {
            const timestamp = new Date(date);
            timestamp.setHours(6 + Math.floor(r * 18 / readingsPerDay), Math.floor(Math.random() * 60), 0, 0);
            let baseGlucose = 120 + Math.random() * 40;
            const hour = timestamp.getHours();
            if (hour >= 7 && hour <= 9)
                baseGlucose += 30 + Math.random() * 20;
            if (hour >= 12 && hour <= 14)
                baseGlucose += 25 + Math.random() * 15;
            if (hour >= 18 && hour <= 20)
                baseGlucose += 35 + Math.random() * 25;
            if (day % 7 < 2) {
                baseGlucose += 20 + Math.random() * 30;
            }
            if (day % 5 === 0 && r > 5 && r < 10) {
                baseGlucose -= 40 + Math.random() * 20;
            }
            const value = Math.max(50, Math.min(400, Math.round(baseGlucose)));
            readings.push({
                patientId,
                value,
                timestamp,
                source: "cgm",
            });
        }
    }
    return readings;
}
function generateLifeEvents(patientId, days = 30) {
    const events = [];
    const now = new Date();
    const eventTypes = [
        {
            type: "meal",
            meta: (i) => ({
                description: ["Breakfast", "Lunch", "Dinner", "Snack"][i % 4],
                carbs: Math.round(30 + Math.random() * 60),
            }),
        },
        {
            type: "activity",
            meta: () => ({
                description: ["Walk", "Gym", "Yoga", "Swimming"][Math.floor(Math.random() * 4)],
                duration_minutes: Math.round(15 + Math.random() * 60),
                intensity: ["low", "moderate", "high"][Math.floor(Math.random() * 3)],
            }),
        },
        {
            type: "stress",
            meta: () => ({
                description: ["Work deadline", "Family call", "Argument", "Anxiety"][Math.floor(Math.random() * 4)],
                severity: ["low", "moderate", "high"][Math.floor(Math.random() * 3)],
            }),
        },
        {
            type: "medication",
            meta: () => ({
                name: ["Metformin", "Insulin", "Glipizide"][Math.floor(Math.random() * 3)],
                dosage: `${Math.round(5 + Math.random() * 20)}mg`,
            }),
        },
        {
            type: "sleep",
            meta: () => ({
                hours: Math.round(5 + Math.random() * 4),
                quality: ["poor", "fair", "good", "excellent"][Math.floor(Math.random() * 4)],
            }),
        },
    ];
    for (let day = days; day >= 0; day--) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        const numEvents = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numEvents; i++) {
            const eventTemplate = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const timestamp = new Date(date);
            timestamp.setHours(6 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60), 0, 0);
            events.push({
                patientId,
                type: eventTemplate.type,
                timestamp,
                metadata: eventTemplate.meta(i),
            });
        }
    }
    return events;
}
async function main() {
    console.log("Seeding database...");
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const clinician = await prisma.clinician.create({
        data: {
            name: "Dr. Sarah Chen",
            email: "sarah.chen@carepulse.demo",
            passwordHash,
        },
    });
    console.log(`Created clinician: ${clinician.name} (${clinician.id})`);
    const patient = await prisma.patient.create({
        data: {
            name: "Maria Garcia",
            email: "maria@carepulse.demo",
            diabetesType: "type2",
            passwordHash,
            clinicianId: clinician.id,
        },
    });
    console.log(`Created patient: ${patient.name} (${patient.id})`);
    const secondPatient = await prisma.patient.create({
        data: {
            name: "James Wilson",
            email: "james@carepulse.demo",
            diabetesType: "type1",
            passwordHash,
            clinicianId: clinician.id,
        },
    });
    console.log(`Created patient: ${secondPatient.name} (${secondPatient.id})`);
    console.log("Generating glucose readings for Maria...");
    const mariaReadings = generateGlucoseData(patient.id, 30);
    await prisma.glucoseReading.createMany({ data: mariaReadings });
    console.log(`  Created ${mariaReadings.length} glucose readings`);
    console.log("Generating life events for Maria...");
    const mariaEvents = generateLifeEvents(patient.id, 30);
    await prisma.lifeEvent.createMany({ data: mariaEvents });
    console.log(`  Created ${mariaEvents.length} life events`);
    console.log("Generating glucose readings for James...");
    const jamesReadings = generateGlucoseData(secondPatient.id, 14);
    await prisma.glucoseReading.createMany({ data: jamesReadings });
    console.log(`  Created ${jamesReadings.length} glucose readings`);
    console.log("Generating life events for James...");
    const jamesEvents = generateLifeEvents(secondPatient.id, 14);
    await prisma.lifeEvent.createMany({ data: jamesEvents });
    console.log(`  Created ${jamesEvents.length} life events`);
    console.log("\nSeed complete!");
    console.log("\nDemo credentials:");
    console.log("  Patient:    maria@carepulse.demo / demo1234");
    console.log("  Clinician:  sarah.chen@carepulse.demo / demo1234");
    console.log(`\n  Maria's patient ID: ${patient.id}`);
    console.log(`  James's patient ID: ${secondPatient.id}`);
    console.log(`  Clinician ID: ${clinician.id}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map