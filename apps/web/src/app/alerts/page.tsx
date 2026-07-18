"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import {
  Bell,
  CheckCircle,
  Share2,
  Clock,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { isConnected, lastEvent } = useSocket(activePatientId);

  const patternsQuery = useQuery({
    queryKey: ["patterns", activePatientId, statusFilter],
    queryFn: () => queries.patterns.listByPatient(activePatientId!),
    enabled: !!activePatientId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      queries.patterns.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patterns", activePatientId],
      });
    },
  });

  const runDetectionMutation = useMutation({
    mutationFn: () => queries.agents.runPattern(activePatientId!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patterns", activePatientId],
      });
    },
  });

  const filteredPatterns =
    patternsQuery.data?.filter((p: any) =>
      statusFilter === "all" ? true : p.status === statusFilter
    ) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientId.trim()) {
      setActivePatientId(patientId.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="mt-1 text-gray-600">
            Detected patterns and notifications
          </p>
        </div>
        {activePatientId && (
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-success-500" : "bg-gray-300"
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        )}
      </div>

      {!activePatientId ? (
        <div className="card mx-auto max-w-md text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-300" />
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
              View Alerts
            </button>
          </form>
        </div>
      ) : (
        <>
          {lastEvent && (
            <div className="card border-primary-200 bg-primary-50">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-primary-700">
                    New {lastEvent.event.replace("_", " ")}
                  </p>
                  <p className="text-xs text-primary-500">
                    {new Date(lastEvent.payload.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              {["all", "new", "acknowledged", "shared_with_clinician"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-primary-100 text-primary-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status === "all"
                      ? "All"
                      : status.replace("_", " ")}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => runDetectionMutation.mutate()}
              disabled={runDetectionMutation.isPending}
              className="btn-secondary text-xs"
            >
              {runDetectionMutation.isPending ? (
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
              ) : (
                <AlertTriangle className="mr-1 inline h-3 w-3" />
              )}
              Run Detection
            </button>
          </div>

          <div className="space-y-3">
            {filteredPatterns.length === 0 ? (
              <div className="card text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">
                  No patterns found with current filter.
                </p>
              </div>
            ) : (
              filteredPatterns.map((pattern: any) => (
                <div key={pattern.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span
                          className={`${
                            pattern.status === "new"
                              ? "badge-new"
                              : pattern.status === "acknowledged"
                                ? "badge-acknowledged"
                                : "badge-shared"
                          }`}
                        >
                          {pattern.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(pattern.detectedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {pattern.summary}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>Trigger: {pattern.triggerEventType}</span>
                        <span>
                          Confidence:{" "}
                          {(pattern.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {pattern.status === "new" && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: pattern.id,
                              status: "acknowledged",
                            })
                          }
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Mark as acknowledged"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {pattern.status !== "shared_with_clinician" && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: pattern.id,
                              status: "shared_with_clinician",
                            })
                          }
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Share with clinician"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
