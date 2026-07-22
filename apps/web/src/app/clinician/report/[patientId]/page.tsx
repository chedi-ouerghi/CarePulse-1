"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { queries } from "@/lib/api";
import {
  FileText,
  TrendingUp,
  Target,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Activity,
  Clock,
  Users,
  BrainCircuit,
  Droplets,
  Gauge,
  BarChart3,
  LineChart as LineChartIcon,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import Link from "next/link";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function ClinicianReportPage({ params }: { params: { patientId: string } }) {
  const { patientId } = params;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => queries.patients.get(patientId),
    enabled: !!user && !!patientId,
  });

  const reportsQuery = useQuery({
    queryKey: ["reports", patientId],
    queryFn: () => queries.reports.listByPatient(patientId),
    enabled: !!user && !!patientId,
  });

  const twinQuery = useQuery({
    queryKey: ["twin", patientId],
    queryFn: () => queries.twin.get(patientId),
    enabled: !!user && !!patientId,
  });

  const analysesQuery = useQuery({
    queryKey: ["analyses-patient", patientId],
    queryFn: () => queries.analyses.listByPatient(patientId),
    enabled: !!user && !!patientId,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts-patient", patientId],
    queryFn: () => queries.alerts.listByPatient(patientId),
    enabled: !!user && !!patientId,
  });

  const generateReportMutation = useMutation({
    mutationFn: () => queries.agents.runBrief(patientId, user?.profileId, 90),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", patientId] });
    },
  });

  const readmissionMutation = useMutation({
    mutationFn: () => {
      const p = patient || {};
      return queries.agents.predictReadmission({
        age: p.age ?? 50, race: p.race ?? "Unknown", gender: p.gender ?? "Unknown",
        time_in_hospital: p.timeInHospital ?? 3, num_lab_procedures: p.numLabProcedures ?? 20,
        num_procedures: p.numProcedures ?? 1, num_medications: p.numMedications ?? 8,
        number_outpatient: p.numberOutpatient ?? 0, number_emergency: p.numberEmergency ?? 0,
        number_inpatient: p.numberInpatient ?? 0, number_diagnoses: p.numberDiagnoses ?? 5,
        change: p.change ?? "No", diabetes_med: p.diabetesMed ?? "Yes",
      });
    },
    onError: () => {},
  });

  const markReviewedMutation = useMutation({
    mutationFn: (reportId: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/reports/${reportId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("carepulse_token")}`,
        },
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", patientId] });
    },
  });

  const latestReport = reportsQuery.data?.[0];
  const patient = patientQuery.data;
  const stats = twinQuery.data?.stats;
  const readings = twinQuery.data?.cleanedReadings || [];
  const activeAlerts = (alertsQuery.data || []).filter((a: any) => a.status === "active");

  const chartData = readings.slice(-100).map((r: any) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    value: r.value,
  }));

  const reportStats = latestReport?.summary?.statsSnapshot;
  const reportRisks = latestReport?.summary?.riskScores;

  const tirData = reportStats
    ? [
        { name: "In Range", value: Math.round((reportStats.timeInRange || 0) * 100), fill: "#22c55e" },
        { name: "Above", value: Math.round(Math.max(0, 100 - (reportStats.timeInRange || 0) * 100 - (reportStats.hypoEvents || 0) * 2)), fill: "#f59e0b" },
        { name: "Below", value: Math.round(Math.min((reportStats.hypoEvents || 0) * 2, 100 - (reportStats.timeInRange || 0) * 100)), fill: "#ef4444" },
      ]
    : [];

  const riskBarData = reportRisks
    ? [
        { name: "Hyperglycemia", value: Math.round((reportRisks.hyperglycemia || 0) * 100) },
        { name: "Hypoglycemia", value: Math.round((reportRisks.hypoglycemia || 0) * 100) },
        { name: "Adherence", value: Math.round((reportRisks.adherence || 0) * 100) },
        { name: "Lifestyle", value: Math.round((reportRisks.lifestyle || 0) * 100) },
      ]
    : [];

  const patientName = typeof patient?.name === "string" && patient.name.trim() ? patient.name : "Unknown Patient";

  return (
    <div className="min-h-full bg-[#f5f7fa]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fadeIn">
          <div className="flex items-center gap-4">
            <Link
              href="/clinician/dashboard"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#0f172a]">Clinical Report</h1>
                {latestReport && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-0.5 text-[10px] font-semibold border border-blue-200">
                    {latestReport.status?.toUpperCase() || "FINAL"}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#64748b] mt-0.5">
                {patient ? `Pre-visit summary for ${patientName}` : `Patient ID: ${patientId}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => readmissionMutation.mutate()}
              disabled={readmissionMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {readmissionMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              Readmission
            </button>
            <button
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              {generateReportMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Generate
            </button>
          </div>
        </div>

        {generateReportMutation.isError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slideDown">
            Error: {(generateReportMutation.error as Error).message}
          </div>
        )}

        {readmissionMutation.isError && (
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700 animate-slideDown">
            Readmission agent unavailable
          </div>
        )}

        {readmissionMutation.data && (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm animate-slideDown">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-900">30-day Readmission Risk</p>
                  <p className="text-xs text-orange-600">Based on demographic and clinical factors</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-900">
                  {(readmissionMutation.data.riskScore * 100).toFixed(1)}%
                </p>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 border border-orange-200 shadow-sm">
                  {readmissionMutation.data.riskLevel || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        )}

        {latestReport ? (
          <div className="space-y-6">
            {/* Headline */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Clinical Headline</p>
                  <p className="mt-1 text-lg font-bold text-blue-900">
                    {latestReport.summary?.headline || "Clinical Report"}
                  </p>
                  <p className="mt-2 text-xs text-blue-500 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Generated: {new Date(latestReport.generatedAt || latestReport.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats + Risk Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Stats Snapshot */}
              {reportStats && (
                <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-1">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#0f172a]">Stats Snapshot</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-xl bg-[#f8fafc] p-3">
                      <p className="stat-label">Time In Range</p>
                      <p className="text-xl font-bold text-emerald-600 mt-0.5">{((reportStats.timeInRange || 0) * 100).toFixed(0)}%</p>
                    </div>
                    <div className="rounded-xl bg-[#f8fafc] p-3">
                      <p className="stat-label">Avg Glucose</p>
                      <p className="text-xl font-bold text-[#0f172a] mt-0.5">{reportStats.avgGlucose || "—"} <span className="text-xs font-normal text-[#94a3b8]">mg/dL</span></p>
                    </div>
                    <div className="rounded-xl bg-[#f8fafc] p-3">
                      <p className="stat-label">Hypo Events</p>
                      <p className="text-xl font-bold text-red-600 mt-0.5">{reportStats.hypoEvents || 0}</p>
                    </div>
                    <div className="rounded-xl bg-[#f8fafc] p-3">
                      <p className="stat-label">Hyper Events</p>
                      <p className="text-xl font-bold text-orange-600 mt-0.5">{reportStats.hyperEvents || 0}</p>
                    </div>
                  </div>
                  {tirData.length > 0 && (
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={tirData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                          {tirData.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* Risk Scores */}
              {reportRisks && (
                <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-2">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
                      <Gauge className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#0f172a]">Risk Scores</h3>
                  </div>
                  <div className="space-y-3 mb-4">
                    {riskBarData.map((r) => (
                      <div key={r.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[#64748b]">{r.name}</span>
                          <span className="text-xs font-semibold text-[#0f172a]">{r.value}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${r.value}%`,
                              background: r.value > 70
                                ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                                : r.value > 40
                                ? "linear-gradient(90deg, #22c55e, #f59e0b)"
                                : "linear-gradient(90deg, #22c55e, #16a34a)"
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {latestReport.summary?.riskScores?.overallRisk && (
                    <div className="flex items-center justify-between rounded-xl bg-[#f8fafc] p-3">
                      <span className="text-xs font-medium text-[#64748b]">Overall Risk</span>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                          latestReport.summary.riskScores.overallRisk === "high" || latestReport.summary.riskScores.overallRisk === "very_high"
                            ? "bg-red-100 text-red-700"
                            : latestReport.summary.riskScores.overallRisk === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {latestReport.summary.riskScores.overallRisk.toUpperCase().replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Glucose Trend Chart */}
            {chartData.length > 0 && (
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm shadow-sm animate-fadeIn stagger-3">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                      <LineChartIcon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#0f172a]">Glucose Trend</h3>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-[#94a3b8]">
                    <Clock className="h-3 w-3" />
                    Last {readings.length} readings
                  </span>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[40, 400]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip contentStyle={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }} />
                      <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Hypo", fill: "#ef4444", fontSize: 10, fontWeight: 600, position: "insideTopLeft" }} />
                      <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Hyper", fill: "#f59e0b", fontSize: 10, fontWeight: 600, position: "insideTopLeft" }} />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Key Findings */}
            {latestReport.summary?.keyFindings?.length > 0 && (
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-sm">
                    <Target className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0f172a]">Key Findings</h3>
                </div>
                <div className="space-y-2">
                  {(latestReport.summary.keyFindings as any[]).map((finding: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-[#f8fafc] p-3">
                      <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      <div>
                        {finding.category && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">{finding.category}</span>
                        )}
                        <p className="text-sm text-[#334155] mt-0.5">{finding.finding || finding}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {latestReport.summary?.recommendations?.length > 0 && (
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                    <FileText className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0f172a]">Recommendations</h3>
                </div>
                <div className="space-y-2">
                  {(latestReport.summary.recommendations as string[]).map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-[#f8fafc] p-3">
                      <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <p className="text-sm text-[#334155]">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Analysis (Agent 1) */}
            {analysesQuery.data && analysesQuery.data.length > 0 && (
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 shadow-sm animate-fadeIn stagger-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-sm">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0f172a]">Clinical Analysis (Agent 1)</h3>
                  <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] font-semibold border border-purple-200">
                    {analysesQuery.data.length} analyses
                  </span>
                </div>
                {analysesQuery.data[0]?.patterns && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">Patterns</p>
                    <div className="space-y-2">
                      {(Array.isArray(analysesQuery.data[0].patterns)
                        ? analysesQuery.data[0].patterns
                        : Object.values(analysesQuery.data[0].patterns)
                      ).slice(0, 5).map((pattern: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-white/60 p-2">
                          <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                          <p className="text-xs text-[#334155]">
                            {typeof pattern === "string"
                              ? pattern
                              : pattern?.description || pattern?.finding || JSON.stringify(pattern)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysesQuery.data[0]?.correlations && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">Correlations</p>
                    <div className="space-y-2">
                      {(Array.isArray(analysesQuery.data[0].correlations)
                        ? analysesQuery.data[0].correlations
                        : Object.values(analysesQuery.data[0].correlations)
                      ).slice(0, 5).map((corr: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-white/60 p-2">
                          <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                          <p className="text-xs text-[#334155]">
                            {typeof corr === "string"
                              ? corr
                              : corr?.description || corr?.finding || JSON.stringify(corr)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysesQuery.data[0]?.recommendations && (
                  <div>
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">AI Recommendations</p>
                    <div className="space-y-2">
                      {(analysesQuery.data[0].recommendations as any[]).slice(0, 5).map((rec: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-white/60 p-2">
                          <span className="mt-1 flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <p className="text-xs text-[#334155]">
                            {typeof rec === "string" ? rec : rec?.description || rec?.recommendation || JSON.stringify(rec)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysesQuery.data[0]?.confidenceLevel && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/60 p-2">
                    <span className="text-xs font-medium text-purple-700">Confidence:</span>
                    <div className="flex-1 h-2 rounded-full bg-purple-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        style={{ width: `${(analysesQuery.data[0].confidenceLevel || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-purple-700">
                      {((analysesQuery.data[0].confidenceLevel || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mark as Reviewed Button */}
            {latestReport && (
              <div className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-6b">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">Review Status</p>
                    {latestReport.reviewedAt ? (
                      <p className="text-xs text-emerald-600">
                        Reviewed on {new Date(latestReport.reviewedAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-xs text-[#94a3b8]">Not yet reviewed</p>
                    )}
                  </div>
                </div>
                {!latestReport.reviewedAt && (
                  <button
                    onClick={() => markReviewedMutation.mutate(latestReport.id)}
                    disabled={markReviewedMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-lg shadow-emerald-500/20 transition-all duration-150 active:scale-95 disabled:opacity-50"
                  >
                    {markReviewedMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Mark as Reviewed
                  </button>
                )}
                {latestReport.reviewedAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Reviewed
                  </span>
                )}
              </div>
            )}

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#0f172a]">Active Alerts</h3>
                  <span className="chip bg-red-50 text-red-600 text-[10px]">{activeAlerts.length}</span>
                </div>
                <div className="space-y-2">
                  {activeAlerts.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className={`rounded-xl border p-3 ${
                      alert.severity === "critical" || alert.severity === "high"
                        ? "bg-red-50 border-red-200"
                        : alert.severity === "medium"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`chip text-[10px] font-bold ${
                          alert.severity === "critical" || alert.severity === "high"
                            ? "bg-red-100 text-red-700"
                            : alert.severity === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>{alert.severity.toUpperCase()}</span>
                        <span className="text-xs font-semibold text-[#0f172a]">{alert.title}</span>
                      </div>
                      <p className="text-xs text-[#64748b]">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Reports */}
            {reportsQuery.data && reportsQuery.data.length > 1 && (
              <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-7">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Previous Reports</h3>
                <div className="space-y-2">
                  {reportsQuery.data.slice(1, 5).map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between rounded-xl bg-[#f8fafc] p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#94a3b8]" />
                        <span className="text-sm text-[#64748b]">{report.summary?.headline?.slice(0, 60) || "Report"}</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">{new Date(report.generatedAt || report.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-12 text-center shadow-sm animate-fadeIn">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[#cbd5e1]" />
            <p className="text-lg font-semibold text-[#64748b]">No reports generated yet</p>
            <p className="text-sm text-[#94a3b8] mt-1">Click &quot;Generate&quot; to create a clinical report</p>
          </div>
        )}
      </div>
    </div>
  );
}
