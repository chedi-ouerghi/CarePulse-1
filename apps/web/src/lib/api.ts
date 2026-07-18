const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

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
      throw new Error(error.error || `HTTP ${response.status}`);
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
  patterns: {
    listByPatient: (patientId: string) =>
      api.get<any[]>(`/patterns/patient/${patientId}`),
    get: (id: string) => api.get<any>(`/patterns/${id}`),
    updateStatus: (id: string, status: string) =>
      api.patch<any>(`/patterns/${id}/status`, { status }),
  },
  briefs: {
    listByPatient: (patientId: string) =>
      api.get<any[]>(`/briefs/patient/${patientId}`),
    getLatest: (patientId: string) =>
      api.get<any>(`/briefs/patient/${patientId}/latest`),
    get: (id: string) => api.get<any>(`/briefs/${id}`),
  },
  agents: {
    runDataSteward: (patientId: string) =>
      api.post<any>(`/agents/data-steward/${patientId}`),
    runPattern: (patientId: string) =>
      api.post<any>(`/agents/pattern/${patientId}`),
    runCoach: (patientId: string, patternId?: string) =>
      api.post<any>(
        `/agents/coach/${patientId}${patternId ? `?patternId=${patternId}` : ""}`
      ),
    runBrief: (patientId: string, periodDays?: number) =>
      api.post<any>(
        `/agents/brief/${patientId}${periodDays ? `?periodDays=${periodDays}` : ""}`
      ),
  },
  ingestion: {
    upload: (patientId: string, file: File, fileType: string) =>
      api.upload<any>(`/ingestion/upload/${patientId}`, file, fileType),
  },
  auth: {
    loginPatient: (email: string, password: string) =>
      api.post<any>("/auth/login/patient", { email, password }),
    loginClinician: (email: string, password: string) =>
      api.post<any>("/auth/login/clinician", { email, password }),
    register: (data: any) => api.post<any>("/auth/register/patient", data),
    me: () => api.get<any>("/auth/me"),
  },
};
