// ======================================================================
// Shared TypeScript types for CarePulse frontend
// ======================================================================

// ── Auth ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: "patient" | "clinician";
  profileId?: string;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

// ── Chat ─────────────────────────────────────────────────────────────

export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageSenderType = "PATIENT" | "AI_AGENT" | "CLINICIAN" | "SYSTEM";
export type DeliveryStatus = "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

/** Raw message as returned by the backend API. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  sender: MessageSenderType;
  channel: string;
  contentText: string | null;
  audioUrl: string | null;
  transcript: string | null;
  ttsAudioUrl: string | null;
  status: DeliveryStatus;
  providerMessageId: string | null;
  sentAt: string | null;
  createdAt: string;
}

/** Normalized message for display in the chat UI. */
export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  status: "sending" | "sent" | "failed";
}

export interface Conversation {
  id: string;
  patientId: string;
  clinicianId: string | null;
  agent: string;
  channel: string;
  isActive: boolean;
  startedAt: string;
  lastMessageAt: string;
  messages?: ChatMessage[];
}

export interface SendMessageResponse {
  inbound: ChatMessage;
  outbound: ChatMessage;
}

// ── Twin / Glucose ──────────────────────────────────────────────────

export interface GlucoseReading {
  id: string;
  patientId: string;
  value: number;
  timestamp: string;
  isAnomaly?: boolean;
  mealContext?: string;
  source?: string;
}

export interface TwinStats {
  avgGlucose: number | null;
  timeInRange: number | null;
  hypoEvents: number;
  hyperEvents: number;
  totalReadings: number;
  dataQualityScore: number | null;
}

export interface TwinSnapshot {
  patientId: string;
  stats: TwinStats | null;
  cleanedReadings: GlucoseReading[];
  anomalies: GlucoseReading[];
  gaps: Array<{ start: string; end: string; durationHours: number }>;
  lifeEvents: LifeEvent[];
}

export interface LifeEvent {
  id: string;
  patientId: string;
  eventType: string;
  description: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ── Clinical Analysis ───────────────────────────────────────────────

export interface ClinicalAnalysis {
  id: string;
  patientId: string;
  patterns: any;
  risks: Array<{ level: string; description?: string }>;
  recommendations: any;
  observations: any;
  explanations: string | null;
  summary: any;
  stats?: any;
  correlations?: any;
  confidenceLevel?: number;
  modelVersion: string | null;
  generatedAt: string;
  createdAt: string;
}

// ── Risk Assessment ─────────────────────────────────────────────────

export interface RiskAssessment {
  id: string;
  patientId: string;
  hyperglycemiaRisk: number;
  hypoglycemiaRisk: number;
  adherenceScore: number;
  lifestyleScore: number;
  overallRisk: string;
  riskLevel?: string;
  details: unknown;
  createdAt: string;
}

// ── Alerts ───────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  patientId: string;
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "acknowledged" | "resolved";
  createdAt: string;
}

// ── Clinical Report ─────────────────────────────────────────────────

export interface ClinicalReport {
  id: string;
  patientId: string;
  summary: any;
  priorities: any;
  pointsToWatch: any;
  status?: string;
  reviewedAt?: string | null;
  generatedAt: string;
  createdAt: string;
}

// ── Log / Reading Input ─────────────────────────────────────────────

export interface RecordReadingInput {
  value?: number;
  mealType?: string;
  mealDescription?: string;
  activityType?: string;
  activityDuration?: number;
  symptoms?: string[];
  medications?: string;
  mood?: string;
  observations?: string;
}

// ── Utility ─────────────────────────────────────────────────────────

export type DateRangeFilter = "today" | "7days" | "30days" | "all";
