import type {
  AuthResponse,
  AuthUser,
  ChatMessage,
  Conversation,
  SendMessageResponse,
  ClinicalAnalysis,
  ClinicalReport,
  Alert,
  TwinSnapshot,
  RiskAssessment,
} from "./types";

export type { AuthUser, AuthResponse };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onUnauthorized?: () => void;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  /** Register a callback invoked on 401 responses (e.g. session expired). */
  setOnUnauthorized(cb: () => void) {
    this.onUnauthorized = cb;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle 401 — session expired
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
        throw new Error("Session expired. Please sign in again.");
      }

      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  async upload<T>(path: string, file: File, fileType: string): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
        throw new Error("Session expired. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_URL);

// ── Normalization helpers ──────────────────────────────────────────────

function normalizeArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as T[]) : [];
  }

  return [];
}

function normalizePatient<T extends Record<string, unknown> | null | undefined>(patient: T): T & { name: string; fullName?: string } {
  if (!patient || typeof patient !== "object") {
    return { name: "Unknown Patient" } as T & { name: string; fullName?: string };
  }

  const record = patient as Record<string, unknown> & { name?: string; fullName?: string };
  const displayName = record.name || record.fullName || "Unknown Patient";

  return {
    ...record,
    name: displayName,
    fullName: record.fullName || displayName,
  } as T & { name: string; fullName?: string };
}

function normalizePatientsResponse<T extends Record<string, unknown>>(payload: unknown): T[] {
  const items = normalizeArrayResponse<T>(payload);
  return items.map((item) => normalizePatient(item) as T);
}

// ── API Queries ────────────────────────────────────────────────────────

export const queries = {
  auth: {
    loginPatient: (email: string, password: string) =>
      api.post<AuthResponse>("/auth/login/patient", { email, password }),
    loginClinician: (email: string, password: string) =>
      api.post<AuthResponse>("/auth/login/clinician", { email, password }),
    registerPatient: (data: {
      fullName: string;
      email: string;
      password: string;
      diabetesType: string;
    }) => api.post<AuthResponse>("/auth/register/patient", data),
    registerClinician: (data: {
      fullName: string;
      email: string;
      password: string;
      specialty?: string;
    }) => api.post<AuthResponse>("/auth/register/clinician", data),
    me: () => api.get<{ id: string; email: string; role: string }>("/auth/me"),
  },
  patients: {
    list: () => api.get<unknown>("/patients").then((response) => normalizePatientsResponse<any>(response)),
    listMine: () => api.get<unknown>("/patients/clinic").then((response) => normalizePatientsResponse<any>(response)),
    get: (id: string) => api.get<unknown>(`/patients/${id}`).then((response) => normalizePatient<any>(response as any)),
    create: (data: { name: string; email: string; diabetesType: string }) =>
      api.post<any>("/patients", data),
    assignClinician: (patientId: string) =>
      api.patch<any>(`/patients/${patientId}/assign`),
  },
  clinician: {
    get: (id: string) => api.get<any>(`/clinicians/${id}`),
    list: () => api.get<any[]>("/clinicians"),
  },
  twin: {
    get: (patientId: string, days?: number) =>
      api.get<TwinSnapshot>(`/twin/${patientId}${days ? `?days=${days}` : ""}`),
    record: (patientId: string, data: {
      value?: number;
      mealType?: string;
      mealDescription?: string;
      activityType?: string;
      activityDuration?: number;
      symptoms?: string[];
      medications?: string;
      mood?: string;
      observations?: string;
    }) => api.post<any>(`/twin/reading/${patientId}`, data),
  },
  agents: {
    runAnalysis: (patientId: string, periodDays?: number) =>
      api.post<ClinicalAnalysis>(
        `/agents/analysis/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`
      ),
    runBrief: (patientId: string, clinicianId?: string, periodDays?: number) =>
      api.post<ClinicalReport>(
        `/agents/brief/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`,
        clinicianId ? { clinicianId } : undefined
      ),
    runRisk: (patientId: string) =>
      api.post<RiskAssessment>(`/agents/risk/${patientId}`),
    predictReadmission: (payload: Record<string, unknown>) =>
      api.post<any>(`/agents/doctor/readmission/predict`, payload),
    batchPredictReadmission: (patients: Record<string, unknown>[]) =>
      api.post<any>(`/agents/doctor/readmission/batch`, { patients }),
  },
  ingestion: {
    upload: (patientId: string, file: File, fileType: string) =>
      api.upload<any>(`/ingestion/upload/${patientId}`, file, fileType),
  },
  chat: {
    getConversations: (patientId: string) =>
      api.get<Conversation[]>(`/chat/patient/${patientId}`),
    createConversation: (patientId: string) =>
      api.post<Conversation>(`/chat/patient/${patientId}/conversations`),
    getMessages: (conversationId: string) =>
      api.get<ChatMessage[]>(`/chat/${conversationId}/messages`),
    send: (conversationId: string, content: string) =>
      api.post<SendMessageResponse>(`/chat/${conversationId}/messages`, { content }),
  },
  analyses: {
    listByPatient: (patientId: string) =>
      api.get<unknown>(`/analyses/patient/${patientId}`).then((response) => normalizeArrayResponse<ClinicalAnalysis>(response)),
    getLatest: (patientId: string) =>
      api.get<ClinicalAnalysis>(`/analyses/patient/${patientId}/latest`),
    create: (patientId: string, periodDays?: number) =>
      api.post<ClinicalAnalysis>(`/agents/analysis/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`),
  },
  reports: {
    listByPatient: (patientId: string) =>
      api.get<unknown>(`/reports/patient/${patientId}`).then((response) => normalizeArrayResponse<ClinicalReport>(response)),
    getLatest: (patientId: string) =>
      api.get<ClinicalReport>(`/reports/patient/${patientId}/latest`),
    markReviewed: (reportId: string) =>
      api.patch<any>(`/reports/${reportId}/review`),
  },
  riskAssessments: {
    generate: (patientId: string) =>
      api.post<RiskAssessment>(`/agents/risk/${patientId}`),
  },
  alerts: {
    list: () => api.get<Alert[]>("/alerts"),
    listByPatient: (patientId: string) =>
      api.get<Alert[]>(`/alerts/patient/${patientId}`),
    acknowledge: (id: string) =>
      api.patch<any>(`/alerts/${id}/acknowledge`),
    resolve: (id: string) =>
      api.patch<any>(`/alerts/${id}/resolve`),
  },
};
