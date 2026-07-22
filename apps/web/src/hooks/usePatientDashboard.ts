import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import type {
  TwinSnapshot,
  ClinicalAnalysis,
  Alert,
  RiskAssessment,
} from "@/lib/types";

export function usePatientDashboard(
  patientId: string | undefined,
  token: string | null
) {
  const queryClient = useQueryClient();

  // Socket.IO real-time alerts connection
  const { isConnected, lastEvent } = useSocket({
    patientId,
    token,
    enabled: !!patientId,
  });

  // Invalidate queries when Socket.IO emits events
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.event === "alert" || lastEvent.event === "risk_alert") {
      queryClient.invalidateQueries({ queryKey: ["alerts", patientId] });
      queryClient.invalidateQueries({ queryKey: ["twin", patientId] });
    }
    if (lastEvent.event === "clinical_report") {
      queryClient.invalidateQueries({ queryKey: ["analyses", patientId] });
    }
  }, [lastEvent, patientId, queryClient]);

  // 1. Fetch Twin snapshot with 60s auto-refresh
  const twinQuery = useQuery({
    queryKey: ["twin", patientId],
    queryFn: () => queries.twin.get(patientId!),
    enabled: !!patientId,
    refetchInterval: 60000,
  });

  // 2. Fetch clinical analyses
  const analysesQuery = useQuery({
    queryKey: ["analyses", patientId],
    queryFn: () => queries.analyses.listByPatient(patientId!),
    enabled: !!patientId,
  });

  // 3. Fetch active alerts with 30s auto-refresh
  const alertsQuery = useQuery({
    queryKey: ["alerts", patientId],
    queryFn: () => queries.alerts.listByPatient(patientId!),
    enabled: !!patientId,
    refetchInterval: 30000,
  });

  // Risk Assessment Mutation
  const riskMutation = useMutation({
    mutationFn: () => queries.agents.runRisk(patientId!),
    onSuccess: (data) => {
      queryClient.setQueryData(["latestRisk", patientId], data);
      queryClient.invalidateQueries({ queryKey: ["twin", patientId] });
    },
  });

  // Clinical Analysis Mutation
  const analysisMutation = useMutation({
    mutationFn: () => queries.agents.runAnalysis(patientId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses", patientId] });
    },
  });

  const chartData =
    twinQuery.data?.cleanedReadings?.slice(-100).map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: r.value,
      isAnomaly: r.isAnomaly,
    })) || [];

  const stats = twinQuery.data?.stats;
  const activeAlerts = (alertsQuery.data || []).filter(
    (a: Alert) => a.status === "active"
  );
  const latestRisk: RiskAssessment | undefined =
    riskMutation.data ||
    (queryClient.getQueryData(["latestRisk", patientId]) as RiskAssessment | undefined);

  return {
    isConnected,
    twin: twinQuery.data as TwinSnapshot | undefined,
    stats,
    chartData,
    isLoadingTwin: twinQuery.isLoading,
    isTwinError: twinQuery.isError,
    analyses: (analysesQuery.data as ClinicalAnalysis[]) || [],
    isLoadingAnalyses: analysesQuery.isLoading,
    activeAlerts,
    isLoadingAlerts: alertsQuery.isLoading,
    latestRisk,
    assessRisk: riskMutation.mutate,
    isAssessingRisk: riskMutation.isPending,
    riskError: riskMutation.error,
    runAnalysis: analysisMutation.mutate,
    isAnalyzing: analysisMutation.isPending,
    analysisError: analysisMutation.error,
    refetchAll: () => {
      twinQuery.refetch();
      analysesQuery.refetch();
      alertsQuery.refetch();
    },
  };
}
