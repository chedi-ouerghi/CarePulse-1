"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  MessageCircle,
  Loader2,
  Wifi,
  WifiOff,
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

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  const { isConnected, subscribe } = useSocket(activePatientId);

  const twinQuery = useQuery({
    queryKey: ["twin", activePatientId],
    queryFn: () => queries.twin.get(activePatientId!),
    enabled: !!activePatientId,
  });

  const patternsQuery = useQuery({
    queryKey: ["patterns", activePatientId],
    queryFn: () => queries.patterns.listByPatient(activePatientId!),
    enabled: !!activePatientId,
  });

  const coachMutation = useMutation({
    mutationFn: () => queries.agents.runCoach(activePatientId!),
  });

  const patternMutation = useMutation({
    mutationFn: () => queries.agents.runPattern(activePatientId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patterns", activePatientId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      setActivePatientId(patientId.trim());
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Your diabetes digital twin at a glance
          </p>
        </div>
        {activePatientId && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-success-500" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                Offline
              </>
            )}
          </div>
        )}
      </div>

      {!activePatientId ? (
        <div className="card mx-auto max-w-md text-center">
          <h2 className="mb-4 text-lg font-semibold">Select Patient</h2>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Patient ID"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button type="submit" className="btn-primary">
              Load Twin
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-400">
            Demo: Try patient ID from onboarding
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              label="Avg Glucose"
              value={stats?.avgGlucose?.toString() || "—"}
              unit="mg/dL"
              color="text-primary-600"
            />
            <StatCard
              icon={<Target className="h-5 w-5" />}
              label="Time in Range"
              value={
                stats?.timeInRange
                  ? `${(stats.timeInRange * 100).toFixed(0)}%`
                  : "—"
              }
              color="text-success-600"
            />
            <StatCard
              icon={<TrendingDown className="h-5 w-5" />}
              label="Hypo Events"
              value={stats?.hypoEvents?.toString() || "0"}
              color="text-danger-600"
            />
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              label="Readings"
              value={stats?.totalReadings?.toString() || "0"}
              color="text-gray-600"
            />
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Glucose Trend
              </h2>
              <button
                onClick={() => patternMutation.mutate()}
                disabled={patternMutation.isPending}
                className="btn-secondary text-xs"
              >
                {patternMutation.isPending ? (
                  <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-1 inline h-3 w-3" />
                )}
                Detect Patterns
              </button>
            </div>
            {twinQuery.isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis domain={[40, 400]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <ReferenceLine
                    y={70}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label="Hypo"
                  />
                  <ReferenceLine
                    y={180}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label="Hyper"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Detected Patterns
              </h2>
              {patternsQuery.data?.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No patterns detected yet. Run pattern detection above.
                </p>
              ) : (
                <div className="space-y-3">
                  {patternsQuery.data?.map((p: any) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          {p.triggerEventType}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            p.confidence >= 0.7
                              ? "text-success-600"
                              : "text-warning-600"
                          }`}
                        >
                          {(p.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{p.summary}</p>
                      <span
                        className={`mt-2 inline-block ${
                          p.status === "new"
                            ? "badge-new"
                            : p.status === "acknowledged"
                              ? "badge-acknowledged"
                              : "badge-shared"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Coach
                </h2>
                <button
                  onClick={() => coachMutation.mutate()}
                  disabled={coachMutation.isPending}
                  className="btn-primary text-xs"
                >
                  {coachMutation.isPending ? (
                    <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-1 inline h-3 w-3" />
                  )}
                  Get Coach Message
                </button>
              </div>
              {coachMutation.data?.data ? (
                <div className="rounded-lg border border-primary-100 bg-primary-50 p-4">
                  <p className="text-sm text-primary-800">
                    {coachMutation.data.data.message}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-600">
                      {coachMutation.data.data.tone}
                    </span>
                    {coachMutation.data.data.suggestedAction && (
                      <span className="text-xs text-primary-500">
                        Suggested:{" "}
                        {coachMutation.data.data.suggestedAction}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Click &quot;Get Coach Message&quot; to receive personalized
                  coaching.
                </p>
              )}
            </div>
          </div>
        </>
      )}
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
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-gray-100 p-2 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">
            {value}
            {unit && (
              <span className="ml-1 text-sm font-normal text-gray-400">
                {unit}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
