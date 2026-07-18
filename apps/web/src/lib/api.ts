const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "patient" | "clinician";
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
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
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_URL);

export const queries = {
  auth: {
    loginPatient: (email: string, password: string) =>
      api.post<AuthResponse>("/auth/login/patient", { email, password }),
    loginClinician: (email: string, password: string) =>
      api.post<AuthResponse>("/auth/login/clinician", { email, password }),
    registerPatient: (data: {
      name: string;
      email: string;
      password: string;
      diabetesType: string;
    }) => api.post<AuthResponse>("/auth/register/patient", data),
    registerClinician: (data: {
      name: string;
      email: string;
      password: string;
      specialty?: string;
    }) => api.post<AuthResponse>("/auth/register/clinician", data),
    me: () => api.get<{ id: string; email: string; role: string }>("/auth/me"),
  },
  patients: {
    list: () => api.get<any[]>("/patients"),
    get: (id: string) => api.get<any>(`/patients/${id}`),
    create: (data: any) => api.post<any>("/patients", data),
  },
  clinician: {
    get: (id: string) => api.get<any>(`/clinicians/${id}`),
    list: () => api.get<any[]>("/clinicians"),
  },
  twin: {
    get: (patientId: string, days?: number) =>
      api.get<any>(`/twin/${patientId}${days ? `?days=${days}` : ""}`),
  },
  agents: {
    runAnalysis: (patientId: string, periodDays?: number) =>
      api.post<any>(
        `/agents/analysis/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`
      ),
    runBrief: (patientId: string, clinicianId?: string, periodDays?: number) =>
      api.post<any>(
        `/agents/brief/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`,
        clinicianId ? { clinicianId } : undefined
      ),
    runRisk: (patientId: string) =>
      api.post<any>(`/agents/risk/${patientId}`),
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
      api.get<any[]>(`/chat/conversations/${patientId}`),
    getMessages: (conversationId: string) =>
      api.get<any[]>(`/chat/messages/${conversationId}`),
    send: (patientId: string, content: string, conversationId?: string) =>
      api.post<any>("/chat/send", { patientId, content, conversationId }),
  },
  analyses: {
    listByPatient: (patientId: string) =>
      api.get<any[]>(`/analyses/patient/${patientId}`),
    getLatest: (patientId: string) =>
      api.get<any>(`/analyses/patient/${patientId}/latest`),
    create: (patientId: string, periodDays?: number) =>
      api.post<any>(`/agents/analysis/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`),
  },
  reports: {
    listByPatient: (patientId: string) =>
      api.get<any[]>(`/reports/patient/${patientId}`),
    getLatest: (patientId: string) =>
      api.get<any>(`/reports/patient/${patientId}/latest`),
  },
  riskAssessments: {
    generate: (patientId: string) =>
      api.post<any>(`/agents/risk/${patientId}`),
  },
};
