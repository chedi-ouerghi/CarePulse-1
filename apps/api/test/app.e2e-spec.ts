/**
 * CarePulse — End-to-End Integration Tests
 *
 * Tests the main patient → clinician flow:
 *   1. Health check (Postgres, Redis, risk-model)
 *   2. Patient registration + login
 *   3. Glucose data ingestion
 *   4. Clinician registration + login
 *   5. Patient list + detail
 *   6. Alerts (acknowledge/resolve)
 *   7. Clinical report review
 *
 * Run: npm run test:e2e
 * Requires: running API + Postgres + Redis + risk-model
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";

describe("CarePulse E2E (Full Flow)", () => {
  let app: INestApplication;

  // Tokens set during registration/login
  let patientToken: string;
  let patientId: string;
  let clinicianToken: string;
  let clinicianId: string;
  let clinicianUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  // ────────────────────────────────────────────────────────────────
  // 1. Health Check
  // ────────────────────────────────────────────────────────────────

  describe("GET /api/health", () => {
    it("should return health status with service checks", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/health")
        .expect(200);

      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("timestamp");
      expect(res.body).toHaveProperty("services");
      expect(res.body.services).toHaveProperty("postgres");
      expect(res.body.services).toHaveProperty("redis");
      expect(res.body.services).toHaveProperty("riskModel");

      // At minimum, postgres should be ok (we're testing against it)
      expect(res.body.services.postgres.status).toBe("ok");
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 2. Patient Registration
  // ────────────────────────────────────────────────────────────────

  describe("Patient Registration & Login", () => {
    const testEmail = `test-patient-${Date.now()}@carepulse.test`;

    it("POST /api/auth/register/patient — register a new patient", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/register/patient")
        .send({
          fullName: "Test Patient E2E",
          email: testEmail,
          password: "testpass123",
          diabetesType: "TYPE_2",
        })
        .expect(201);

      expect(res.body).toHaveProperty("access_token");
      expect(res.body.user).toHaveProperty("id");
      expect(res.body.user.email).toBe(testEmail);
      expect(res.body.user.role).toBe("PATIENT");

      patientToken = res.body.access_token;
      patientId = res.body.user.profileId;
    });

    it("POST /api/auth/login/patient — login with registered credentials", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/login/patient")
        .send({ email: testEmail, password: "testpass123" })
        .expect(201);

      expect(res.body).toHaveProperty("access_token");
      expect(res.body.user.role).toBe("PATIENT");
      patientToken = res.body.access_token;
    });

    it("GET /api/patients/me — get own profile", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/patients/me")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(res.body.fullName).toBe("Test Patient E2E");
      expect(res.body.diabetesType).toBe("TYPE_2");
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 3. Glucose Data Ingestion
  // ────────────────────────────────────────────────────────────────

  describe("Glucose Data Ingestion", () => {
    it("POST /api/ingestion/glucose — submit a glucose reading", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/ingestion/glucose")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          value: 185,
          source: "GLUCOMETER",
          takenAt: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body).toHaveProperty("id");
      expect(res.body.value).toBe(185);
    });

    it("GET /api/ingestion/glucose — list glucose readings", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/ingestion/glucose")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 4. Clinician Registration
  // ────────────────────────────────────────────────────────────────

  describe("Clinician Registration & Login", () => {
    const testEmail = `test-clinician-${Date.now()}@carepulse.test`;

    it("POST /api/auth/register/clinician — register a new clinician", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/register/clinician")
        .send({
          fullName: "Dr. Test Clinician",
          email: testEmail,
          password: "testpass123",
          specialty: "Endocrinology",
        })
        .expect(201);

      expect(res.body).toHaveProperty("access_token");
      expect(res.body.user.role).toBe("CLINICIAN");
      clinicianToken = res.body.access_token;
      clinicianId = res.body.user.profileId;
      clinicianUserId = res.body.user.id;
    });

    it("POST /api/auth/login/clinician — login", async () => {
      const res = await request(app.getHttpServer())
        .post("/api/auth/login/clinician")
        .send({ email: testEmail, password: "testpass123" })
        .expect(201);

      expect(res.body).toHaveProperty("access_token");
      clinicianToken = res.body.access_token;
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 5. Clinician: Patient List & Detail
  // ────────────────────────────────────────────────────────────────

  describe("Clinician Patient Management", () => {
    it("GET /api/patients — clinician can list patients", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/patients")
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /api/patients/:id — clinician can view a patient", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/patients/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(res.body.fullName).toBe("Test Patient E2E");
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 6. Clinician: Trigger Risk Analysis (async)
  // ────────────────────────────────────────────────────────────────

  describe("Risk Analysis Pipeline", () => {
    it("POST /api/agents/risk/:patientId — trigger risk scoring + analysis", async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/agents/risk/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(201);

      expect(res.body).toHaveProperty("riskTaskId");
      expect(res.body).toHaveProperty("analysisTaskId");

      // Wait briefly for async processing
      await new Promise((resolve) => setTimeout(resolve, 3000));
    });

    it("GET /api/twin/clinical-risk-assessments/:patientId — check risk assessments", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/twin/clinical-risk-assessments/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 7. Alerts
  // ────────────────────────────────────────────────────────────────

  describe("Alert Management", () => {
    it("GET /api/alerts — clinician can list all alerts", async () => {
      const res = await request(app.getHttpServer())
        .get("/api/alerts")
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /api/alerts/patient/:patientId — clinician can list patient alerts", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/alerts/patient/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 8. Clinical Reports
  // ────────────────────────────────────────────────────────────────

  describe("Clinical Reports", () => {
    it("GET /api/reports/patient/:patientId — list reports", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/reports/patient/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /api/analyses/patient/:patientId — list analyses", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/analyses/patient/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 9. Twin Snapshot
  // ────────────────────────────────────────────────────────────────

  describe("Digital Twin", () => {
    it("GET /api/twin/:patientId — get twin snapshot", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/twin/${patientId}`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("stats");
      expect(res.body).toHaveProperty("cleanedReadings");
    });

    it("POST /api/twin/:patientId/refresh — trigger refresh", async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/twin/${patientId}/refresh`)
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(201);

      expect(res.body).toHaveProperty("taskId");
    });
  });

  // ────────────────────────────────────────────────────────────────
  // 10. Role-based access control
  // ────────────────────────────────────────────────────────────────

  describe("Authorization", () => {
    it("patient cannot access clinician-only endpoints", async () => {
      await request(app.getHttpServer())
        .get("/api/patients")
        .set("Authorization", `Bearer ${patientToken}`)
        .expect(403);
    });

    it("unauthenticated requests are rejected", async () => {
      await request(app.getHttpServer())
        .get("/api/patients")
        .expect(401);
    });

    it("clinician cannot access patient-only endpoints", async () => {
      await request(app.getHttpServer())
        .get("/api/patients/me")
        .set("Authorization", `Bearer ${clinicianToken}`)
        .expect(404); // No patient profile for clinician
    });
  });
});
