"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { queries } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Bell,
  X,
  ChevronDown,
  User,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const SEVERITY_STYLES: Record<
  string,
  { bg: string; text: string; border: string; icon: string }
> = {
  HIGH: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: "text-red-500",
  },
  MEDIUM: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "text-amber-500",
  },
  LOW: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "text-slate-500",
  },
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-red-100 text-red-700 border-red-200",
  acknowledged: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function ClinicianAlertsPage() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // WebSocket connection for real-time alerts
  const { isConnected, subscribe } = useSocket({ token, enabled: !!token });

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: () => queries.alerts.list(),
    enabled: !!user,
  });

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => queries.patients.list(),
    enabled: !!user,
  });

  // Listen for real-time alerts
  const handleNewAlert = useCallback(
    (payload: any) => {
      queryClient.setQueryData(["alerts"], (old: any[] = []) => {
        // Check if alert already exists
        if (old.some((a) => a.id === payload.id)) return old;
        return [payload, ...old];
      });
    },
    [queryClient]
  );

  useEffect(() => {
    const unsub = subscribe("alert", handleNewAlert);
    return () => {
      unsub();
    };
  }, [subscribe, handleNewAlert]);

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => queries.alerts.acknowledge(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) => queries.alerts.resolve(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const alerts = alertsQuery.data || [];
  const patients = patientsQuery.data || [];

  // Filter alerts
  const filteredAlerts = alerts.filter((alert: any) => {
    if (severityFilter && alert.severity !== severityFilter) return false;
    if (statusFilter) {
      const isAcknowledged = !!alert.acknowledgedAt;
      const isResolved = !!alert.resolvedAt;
      if (statusFilter === "active" && (isAcknowledged || isResolved))
        return false;
      if (statusFilter === "acknowledged" && (!isAcknowledged || isResolved))
        return false;
      if (statusFilter === "resolved" && !isResolved) return false;
    }
    return true;
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find((p: any) => p.id === patientId);
    return patient?.name || patient?.fullName || "Unknown Patient";
  };

  const getStatus = (alert: any) => {
    if (alert.resolvedAt) return "resolved";
    if (alert.acknowledgedAt) return "acknowledged";
    return "active";
  };

  return (
    <div className="min-h-full bg-[#f5f7fa]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#94a3b8] tracking-wider uppercase">
                Alerts
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">
                Alert Management
              </h1>
              <p className="mt-0.5 text-sm text-[#64748b]">
                Monitor and manage clinical alerts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  isConnected
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-50 text-slate-500 border border-slate-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                {isConnected ? "Live" : "Offline"}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 animate-fadeIn stagger-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                showFilters
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(severityFilter || statusFilter) && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {(severityFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
                </span>
              )}
            </button>
            {severityFilter && (
              <button
                onClick={() => setSeverityFilter("")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                {severityFilter}
                <X className="h-3 w-3" />
              </button>
            )}
            {statusFilter && (
              <button
                onClick={() => setStatusFilter("")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                {statusFilter}
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm animate-slideDown">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#64748b]">
                    Severity
                  </label>
                  <div className="flex gap-2">
                    {["HIGH", "MEDIUM", "LOW"].map((severity) => (
                      <button
                        key={severity}
                        onClick={() =>
                          setSeverityFilter(
                            severityFilter === severity ? "" : severity
                          )
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          severityFilter === severity
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {severity}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#64748b]">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {["active", "acknowledged", "resolved"].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          setStatusFilter(
                            statusFilter === status ? "" : status
                          )
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                          statusFilter === status
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Alerts List */}
        {alertsQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#94a3b8]" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-12 text-center shadow-sm animate-fadeIn">
            <Bell className="mx-auto mb-4 h-12 w-12 text-[#cbd5e1]" />
            <p className="text-lg font-semibold text-[#64748b]">
              No alerts found
            </p>
            <p className="text-sm text-[#94a3b8] mt-1">
              {severityFilter || statusFilter
                ? "Try adjusting your filters"
                : "All clear - no alerts at the moment"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fadeIn stagger-2">
            {filteredAlerts.map((alert: any, i: number) => {
              const status = getStatus(alert);
              const severityStyle =
                SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.LOW;
              const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.active;

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border ${severityStyle.border} ${severityStyle.bg} p-5 shadow-sm transition-all hover:shadow-md animate-slideUp`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle}`}
                        >
                          {status.toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs text-[#94a3b8]">
                          {alert.category}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-[#0f172a] mb-1">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-[#64748b] mb-3">
                        {alert.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {getPatientName(alert.patientId)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(
                            alert.triggeredAt || alert.createdAt
                          ).toLocaleString()}
                        </span>
                        {alert.acknowledgedAt && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <CheckCircle className="h-3 w-3" />
                            Acknowledged
                          </span>
                        )}
                        {alert.resolvedAt && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="h-3 w-3" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/clinician/report/${alert.patientId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] transition-all"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Patient
                      </Link>

                      {status === "active" && (
                        <>
                          <button
                            onClick={() =>
                              acknowledgeMutation.mutate(alert.id)
                            }
                            disabled={acknowledgeMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-all disabled:opacity-50"
                          >
                            {acknowledgeMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Acknowledge
                          </button>
                          <button
                            onClick={() => resolveMutation.mutate(alert.id)}
                            disabled={resolveMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50"
                          >
                            {resolveMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            Resolve
                          </button>
                        </>
                      )}

                      {status === "acknowledged" && (
                        <button
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50"
                        >
                          {resolveMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
