"use client";

import { useAuth } from "@/components/auth-context";
import { usePatientDashboard } from "@/hooks/usePatientDashboard";
import {
  Activity,
  TrendingDown,
  Target,
  AlertTriangle,
  Loader2,
  Zap,
  BrainCircuit,
  Clock,
  Droplets,
  Gauge,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-[#f5f5f5]", text: "text-[#737373]", border: "border-[#e5e5e5]" },
  medium: { bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fde68a]" },
  high: { bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fecaca]" },
  critical: { bg: "bg-[#fef2f2]", text: "text-[#991b1b]", border: "border-[#fecaca]" },
};

export default function PatientDashboard() {
  const { user, token, logout } = useAuth();
  const {
    isConnected,
    stats,
    chartData,
    isLoadingTwin,
    isTwinError,
    analyses,
    isLoadingAnalyses,
    activeAlerts,
    latestRisk,
    assessRisk,
    isAssessingRisk,
    riskError,
    runAnalysis,
    isAnalyzing,
    analysisError,
    refetchAll,
  } = usePatientDashboard(user?.profileId, token);

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#e5e5e5]/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                <Gauge className="h-4 w-4" />
              </div>
              <h1 className="text-sm font-semibold text-[#0a0a0b]">Dashboard</h1>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-white/80 border border-[#e5e5e5] px-2.5 py-0.5 text-[11px] font-medium shadow-sm">
              {isConnected ? (
                <>
                  <span className="glow-dot text-[#16a34a]" />
                  Live
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-[#a3a3a3]" />
                  Offline
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-[#fef2f2] border border-[#fecaca] px-2.5 py-0.5 text-[11px] font-medium text-[#dc2626] animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                {activeAlerts.length} alert{activeAlerts.length > 1 ? "s" : ""}
              </div>
            )}
            <span className="text-sm text-[#a3a3a3]">{user?.name}</span>
            <button onClick={logout} className="btn-ghost text-[11px]" title="Sign out">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="space-y-6">
          {/* Welcome + Actions */}
          <div className="flex items-end justify-between animate-fadeIn">
            <div>
              <p className="text-xs font-medium text-[#a3a3a3] tracking-wider uppercase">
                Welcome back
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0a0a0b]">
                {user?.name?.split(" ")[0] || "Patient"}
              </h2>
              <p className="mt-0.5 text-sm text-[#737373]">
                Here&apos;s your latest health snapshot
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetchAll()}
                className="btn-ghost text-xs"
                title="Refresh dashboard data"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => runAnalysis()}
                disabled={isAnalyzing}
                className="btn-subtle text-xs"
              >
                {isAnalyzing ? (
                  <Loader2 className="mr-1.5 inline h-3 w-3 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-1.5 inline h-3 w-3" />
                )}
                Analyze
              </button>
              <button
                onClick={() => assessRisk()}
                disabled={isAssessingRisk}
                className="btn-primary-apple text-xs"
              >
                {isAssessingRisk ? (
                  <Loader2 className="mr-1.5 inline h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="mr-1.5 inline h-3 w-3" />
                )}
                Assess Risk
              </button>
            </div>
          </div>

          {/* Global Errors */}
          {(riskError || analysisError || isTwinError) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> An error occurred while fetching data
              </div>
              {riskError && <p>Risk Assessment Error: {(riskError as Error).message}</p>}
              {analysisError && <p>Analysis Error: {(analysisError as Error).message}</p>}
              {isTwinError && <p>Twin Data Error: Failed to load glucose stats.</p>}
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="animate-fadeIn stagger-1">
              <StatCard
                icon={<Droplets className="h-4 w-4" />}
                label="Avg Glucose"
                value={stats?.avgGlucose ? stats.avgGlucose.toFixed(1) : "—"}
                unit="mg/dL"
                gradient="from-blue-500 to-cyan-500"
                glow="shadow-blue-500/10"
                isLoading={isLoadingTwin}
              />
            </div>
            <div className="animate-fadeIn stagger-2">
              <StatCard
                icon={<Target className="h-4 w-4" />}
                label="Time in Range"
                value={
                  stats?.timeInRange !== undefined && stats?.timeInRange !== null
                    ? `${(stats.timeInRange * 100).toFixed(0)}`
                    : "—"
                }
                unit="%"
                gradient="from-emerald-500 to-green-500"
                glow="shadow-emerald-500/10"
                isLoading={isLoadingTwin}
              />
            </div>
            <div className="animate-fadeIn stagger-3">
              <StatCard
                icon={<TrendingDown className="h-4 w-4" />}
                label="Hypo Events"
                value={stats?.hypoEvents !== undefined ? stats.hypoEvents.toString() : "0"}
                unit="events"
                gradient="from-red-500 to-rose-500"
                glow="shadow-red-500/10"
                isLoading={isLoadingTwin}
              />
            </div>
            <div className="animate-fadeIn stagger-4">
              <StatCard
                icon={<Activity className="h-4 w-4" />}
                label="Readings"
                value={stats?.totalReadings !== undefined ? stats.totalReadings.toString() : "0"}
                unit="total"
                gradient="from-gray-500 to-slate-500"
                glow="shadow-gray-500/10"
                isLoading={isLoadingTwin}
              />
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chart */}
            <div className="glass-card-hover lg:col-span-2 animate-fadeIn stagger-3">
              <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-sm">
                    <Activity className="h-4 w-4" />
                  </div>
                  <h3 className="section-title">Glucose Trend</h3>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-[#a3a3a3]">
                  <Clock className="h-3 w-3" />
                  Last 100 readings
                </span>
              </div>
              <div className="p-5">
                {isLoadingTwin ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[#a3a3a3]" />
                      <span className="text-xs text-[#a3a3a3]">Loading glucose data...</span>
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f5]">
                        <Activity className="h-6 w-6 text-[#d4d4d4]" />
                      </div>
                      <p className="text-sm font-medium text-[#a3a3a3]">No glucose data yet</p>
                      <p className="mt-0.5 text-xs text-[#d4d4d4]">Upload data to see your trends</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11, fill: "#a3a3a3" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[40, 400]}
                        tick={{ fontSize: 11, fill: "#a3a3a3" }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          backdropFilter: "blur(8px)",
                          border: "1px solid #e5e5e5",
                          borderRadius: "12px",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                          fontSize: "12px",
                        }}
                        labelStyle={{ fontWeight: 600, color: "#0a0a0b" }}
                      />
                      <ReferenceLine
                        y={70}
                        stroke="#dc2626"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: "Hypo",
                          position: "insideTopLeft",
                          fill: "#dc2626",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <ReferenceLine
                        y={180}
                        stroke="#d97706"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: "Hyper",
                          position: "insideTopLeft",
                          fill: "#d97706",
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4 animate-fadeIn stagger-4">
              {/* Quick Risk Check */}
              <div className="glass-card-hover">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                      <Zap className="h-4 w-4" />
                    </div>
                    <h3 className="section-title">Risk Check</h3>
                  </div>
                </div>
                <div className="p-5">
                  {isAssessingRisk ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[#a3a3a3]" />
                    </div>
                  ) : latestRisk ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="stat-label">Overall Status</span>
                        <span
                          className={`chip text-xs font-semibold ${
                            (latestRisk.overallRisk || latestRisk.riskLevel) === "high" ||
                            (latestRisk.overallRisk || latestRisk.riskLevel) === "very_high"
                              ? "bg-[#fef2f2] text-[#dc2626]"
                              : (latestRisk.overallRisk || latestRisk.riskLevel) === "medium" ||
                                (latestRisk.overallRisk || latestRisk.riskLevel) === "moderate"
                              ? "bg-[#fffbeb] text-[#d97706]"
                              : "bg-[#f0fdf4] text-[#16a34a]"
                          }`}
                        >
                          {(latestRisk.overallRisk || latestRisk.riskLevel || "low")
                            .toUpperCase()
                            .replace("_", " ")}
                        </span>
                      </div>
                      {latestRisk.hyperglycemiaRisk !== undefined && (
                        <div className="space-y-3 pt-2">
                          <RiskBar
                            label="Hyperglycemia"
                            value={latestRisk.hyperglycemiaRisk}
                            color="bg-gradient-to-r from-amber-500 to-orange-500"
                          />
                          <RiskBar
                            label="Hypoglycemia"
                            value={latestRisk.hypoglycemiaRisk}
                            color="bg-gradient-to-r from-blue-500 to-cyan-500"
                          />
                          <RiskBar
                            label="Adherence"
                            value={latestRisk.adherenceScore ?? 0}
                            color="bg-gradient-to-r from-emerald-500 to-green-500"
                          />
                          <RiskBar
                            label="Lifestyle"
                            value={latestRisk.lifestyleScore ?? 0}
                            color="bg-gradient-to-r from-blue-500 to-cyan-500"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f5]">
                        <AlertTriangle className="h-5 w-5 text-[#d4d4d4]" />
                      </div>
                      <p className="text-sm font-medium text-[#a3a3a3]">No risk assessment yet</p>
                      <p className="mt-0.5 text-xs text-[#d4d4d4]">Click &quot;Assess Risk&quot; above</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div className="glass-card-hover">
                  <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-rose-500 text-white shadow-sm">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <h3 className="section-title">Active Alerts</h3>
                    </div>
                    <span className="chip bg-[#fef2f2] text-[#dc2626] text-[10px]">
                      {activeAlerts.length}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {activeAlerts.slice(0, 5).map((alert, i) => {
                      const colors = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium;
                      return (
                        <div
                          key={alert.id}
                          className={`rounded-xl border ${colors.border} ${colors.bg} p-3 animate-slideUp`}
                          style={{ animationDelay: `${i * 50}ms` }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`chip text-[10px] font-bold ${colors.text} ${colors.bg} border ${colors.border}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-[#0a0a0b]">{alert.title}</span>
                          </div>
                          <p className="text-xs text-[#525252] leading-relaxed">{alert.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Analyses */}
              <div className="glass-card-hover">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                      <BrainCircuit className="h-4 w-4" />
                    </div>
                    <h3 className="section-title">Analyses</h3>
                  </div>
                  <span className="text-[11px] font-medium text-[#a3a3a3]">{analyses.length} total</span>
                </div>
                <div className="p-4">
                  {isLoadingAnalyses ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[#a3a3a3]" />
                    </div>
                  ) : analyses.length === 0 ? (
                    <div className="py-4 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f5]">
                        <BrainCircuit className="h-5 w-5 text-[#d4d4d4]" />
                      </div>
                      <p className="text-sm font-medium text-[#a3a3a3]">No analyses yet</p>
                      <p className="mt-0.5 text-xs text-[#d4d4d4]">Run analysis to get insights</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {analyses.slice(0, 4).map((a, i) => {
                        const topRiskLevel = Array.isArray(a.risks) && a.risks.length > 0 ? a.risks[0].level : null;
                        const riskBadge =
                          topRiskLevel === "high" || topRiskLevel === "very_high"
                            ? "bg-[#fef2f2] text-[#dc2626]"
                            : topRiskLevel === "medium" || topRiskLevel === "moderate"
                            ? "bg-[#fffbeb] text-[#d97706]"
                            : "bg-[#f0fdf4] text-[#16a34a]";
                        return (
                          <div
                            key={a.id}
                            className="group rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3 transition-all duration-200 hover:bg-white hover:shadow-md hover:border-[#d4d4d4] active:scale-[0.99] animate-slideUp"
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#a3a3a3]">
                                <Clock className="h-3 w-3" />
                                {new Date(a.generatedAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              {topRiskLevel && (
                                <span className={`chip text-[10px] font-semibold ${riskBadge}`}>
                                  {topRiskLevel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed text-[#525252] line-clamp-2">
                              {typeof a.summary === "string"
                                ? a.summary
                                : a.summary
                                ? JSON.stringify(a.summary).slice(0, 120)
                                : "No summary available yet."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  gradient,
  glow,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  gradient: string;
  glow: string;
  isLoading?: boolean;
}) {
  return (
    <div className={`glass-card-hover group p-5 relative overflow-hidden ${glow} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 bg-gradient-to-br ${gradient} text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="stat-label">{label}</p>
        {isLoading ? (
          <div className="h-7 w-20 bg-[#f0f0f0] animate-pulse rounded mt-1" />
        ) : (
          <p className="stat-value mt-0.5 animate-number">
            {value}
            {unit && <span className="ml-1 text-sm font-normal text-[#a3a3a3]">{unit}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function RiskBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div className="group">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-[#525252]">{label}</span>
        <span className="text-xs font-semibold text-[#525252] tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0] shadow-inner">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
