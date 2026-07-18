"use client";

import { useAuth } from "@/components/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  BrainCircuit,
  ArrowUpRight,
  Clock,
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

export default function PatientDashboard() {
  const { user, token, logout } = useAuth();
  const queryClient = useQueryClient();

  const twinQuery = useQuery({
    queryKey: ["twin", user?.id],
    queryFn: () => queries.twin.get(user!.id),
    enabled: !!user,
  });

  const analysesQuery = useQuery({
    queryKey: ["analyses", user?.id],
    queryFn: () => queries.analyses.listByPatient(user!.id),
    enabled: !!user,
  });

  const { isConnected } = useSocket(user?.id || null, token);

  const riskMutation = useMutation({
    mutationFn: () => queries.agents.runRisk(user!.id),
  });

  const analysisMutation = useMutation({
    mutationFn: () => queries.agents.runAnalysis(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses", user?.id] });
    },
  });

  const chartData =
    twinQuery.data?.cleanedReadings
      ?.slice(-100)
      .map((r: any) => ({
        time: new Date(r.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: r.value,
        isAnomaly: r.isAnomaly,
      })) || [];

  const stats = twinQuery.data?.stats;

  const latestAnalysis = analysesQuery.data?.[0];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#e5e5e5] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[#0a0a0b]">Dashboard</h1>
            <span className="flex items-center gap-1.5 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-medium text-[#737373]">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3 text-[#16a34a]" />
                  Live
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-[#a3a3a3]" />
                  Offline
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#a3a3a3]">{user?.name}</span>
            <button
              onClick={logout}
              className="btn-subtle text-[11px]"
              title="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-8">
          {/* Welcome + Actions */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-[#a3a3a3] tracking-wider uppercase">
                Welcome back
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0a0a0b]">
                {user?.name?.split(" ")[0] || "Patient"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => analysisMutation.mutate()}
                disabled={analysisMutation.isPending}
                className="btn-subtle text-xs"
              >
                {analysisMutation.isPending ? (
                  <Loader2 className="mr-1.5 inline h-3 w-3 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-1.5 inline h-3 w-3" />
                )}
                Run Analysis
              </button>
              <button
                onClick={() => riskMutation.mutate()}
                disabled={riskMutation.isPending}
                className="btn-primary-apple text-xs"
              >
                {riskMutation.isPending ? (
                  <Loader2 className="mr-1.5 inline h-3 w-3 animate-spin" />
                ) : (
                  <Zap className="mr-1.5 inline h-3 w-3" />
                )}
                Assess Risk
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Avg Glucose"
              value={stats?.avgGlucose?.toFixed(1) || "—"}
              unit="mg/dL"
              color="bg-[#eff6ff] text-[#2563eb]"
            />
            <StatCard
              icon={<Target className="h-4 w-4" />}
              label="Time in Range"
              value={
                stats?.timeInRange
                  ? `${(stats.timeInRange * 100).toFixed(0)}`
                  : "—"
              }
              unit="%"
              color="bg-[#f0fdf4] text-[#16a34a]"
            />
            <StatCard
              icon={<TrendingDown className="h-4 w-4" />}
              label="Hypo Events"
              value={stats?.hypoEvents?.toString() || "0"}
              unit="events"
              color="bg-[#fef2f2] text-[#dc2626]"
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Readings"
              value={stats?.totalReadings?.toString() || "0"}
              unit="total"
              color="bg-[#fafafa] text-[#525252]"
            />
          </div>

          {/* Glucose Chart + Risk + Analyses */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Chart */}
            <div className="glass-card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#2563eb]" />
                  <h3 className="section-title">Glucose Trend</h3>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-[#a3a3a3]">
                  <Clock className="h-3 w-3" />
                  Last 100 readings
                </span>
              </div>
              <div className="p-5">
                {twinQuery.isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-[#a3a3a3]" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8 text-[#d4d4d4]" />
                      <p className="text-sm text-[#a3a3a3]">
                        No glucose data available yet.
                      </p>
                      <p className="mt-0.5 text-xs text-[#d4d4d4]">
                        Upload data to see your trends.
                      </p>
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
                          background: "#fff",
                          border: "1px solid #e5e5e5",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
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
                        activeDot={{
                          r: 4,
                          fill: "#2563eb",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Analyses & Risk Stack */}
            <div className="space-y-4">
              {/* Quick Risk Check */}
              <div className="glass-card">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#d97706]" />
                    <h3 className="section-title">Risk Check</h3>
                  </div>
                </div>
                <div className="p-5">
                  {riskMutation.isPending ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[#a3a3a3]" />
                    </div>
                  ) : riskMutation.data ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[#a3a3a3] uppercase tracking-wider">Overall</span>
                        <span
                          className={`chip text-xs font-semibold ${
                            (riskMutation.data.overallRisk || riskMutation.data.riskLevel) === "high"
                              ? "bg-[#fef2f2] text-[#dc2626]"
                              : (riskMutation.data.overallRisk || riskMutation.data.riskLevel) === "moderate"
                                ? "bg-[#fffbeb] text-[#d97706]"
                                : "bg-[#f0fdf4] text-[#16a34a]"
                          }`}
                        >
                          {(riskMutation.data.overallRisk || riskMutation.data.riskLevel || "low").toUpperCase()}
                        </span>
                      </div>
                      {riskMutation.data.hyperglycemiaRisk !== undefined && (
                        <div className="space-y-2">
                          <RiskBar
                            label="Hyperglycemia"
                            value={riskMutation.data.hyperglycemiaRisk}
                            color="bg-[#d97706]"
                          />
                          <RiskBar
                            label="Hypoglycemia"
                            value={riskMutation.data.hypoglycemiaRisk}
                            color="bg-[#2563eb]"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-[#d4d4d4]" />
                      <p className="text-sm text-[#a3a3a3]">
                        Click &quot;Assess Risk&quot; for a quick assessment.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Analyses */}
              <div className="glass-card">
                <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 text-[#7c3aed]" />
                    <h3 className="section-title">Analyses</h3>
                  </div>
                  <span className="text-[11px] text-[#a3a3a3]">
                    {analysesQuery.data?.length || 0} total
                  </span>
                </div>
                <div className="p-5">
                  {analysesQuery.isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-[#a3a3a3]" />
                    </div>
                  ) : analysesQuery.data?.length === 0 ? (
                    <div className="py-4 text-center">
                      <BrainCircuit className="mx-auto mb-2 h-6 w-6 text-[#d4d4d4]" />
                      <p className="text-sm text-[#a3a3a3]">
                        No analyses yet.
                      </p>
                      <p className="mt-0.5 text-xs text-[#d4d4d4]">
                        Run analysis to get insights.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {analysesQuery.data?.slice(0, 4).map((a: any, i: number) => (
                        <div
                          key={a.id}
                          className="group rounded-xl border border-[#e5e5e5] bg-[#fafafa] p-3 transition-colors hover:bg-[#f5f5f5]"
                        >
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[#a3a3a3]">
                              {new Date(a.generatedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span
                              className={`text-[11px] font-semibold ${
                                a.overallRisk === "high"
                                  ? "text-[#dc2626]"
                                  : a.overallRisk === "moderate"
                                    ? "text-[#d97706]"
                                    : "text-[#16a34a]"
                              }`}
                            >
                              {a.overallRisk || "low"}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-[#525252] line-clamp-2">
                            {(() => {
                              if (typeof a.summary === "string") {
                                return a.summary;
                              }

                              if (a.summary == null) {
                                return "No summary available yet.";
                              }

                              const serialized = JSON.stringify(a.summary);
                              return serialized ? serialized.slice(0, 120) : "No summary available yet.";
                            })()}
                          </p>
                        </div>
                      ))}
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: string;
}) {
  return (
    <div className="glass-card-hover group p-5">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${color} transition-colors`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-0.5">
          {value}
          {unit && (
            <span className="ml-1 text-sm font-normal text-[#a3a3a3]">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function RiskBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-[#525252]">{label}</span>
        <span className="text-xs font-medium text-[#525252]">
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
