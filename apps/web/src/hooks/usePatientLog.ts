import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import type {
  RecordReadingInput,
  GlucoseReading,
  LifeEvent,
  DateRangeFilter,
} from "@/lib/types";

export interface CombinedLogEntry {
  id: string;
  type: "glucose" | "event";
  timestamp: string;
  title: string;
  details: string;
  value?: number;
  isAnomaly?: boolean;
}

export function usePatientLog(patientId: string | undefined) {
  const queryClient = useQueryClient();
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "glucose" | "event">("all");

  // Fetch latest patient twin snapshot for history log display
  const twinQuery = useQuery({
    queryKey: ["twin", patientId],
    queryFn: () => queries.twin.get(patientId!),
    enabled: !!patientId,
  });

  // Record new log entry
  const recordMutation = useMutation({
    mutationFn: (data: RecordReadingInput) =>
      queries.twin.record(patientId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twin", patientId] });
    },
  });

  // Transform readings and life events into a unified historical log feed
  const historyFeed = useMemo<CombinedLogEntry[]>(() => {
    if (!twinQuery.data) return [];
    const readings = twinQuery.data.cleanedReadings || [];
    const events = twinQuery.data.lifeEvents || [];

    const formattedReadings: CombinedLogEntry[] = readings.map((r: GlucoseReading) => ({
      id: r.id,
      type: "glucose",
      timestamp: r.timestamp,
      title: `Glucose: ${r.value} mg/dL`,
      details: r.mealContext ? `Context: ${r.mealContext}` : "Blood glucose reading",
      value: r.value,
      isAnomaly: r.isAnomaly,
    }));

    const formattedEvents: CombinedLogEntry[] = events.map((e: LifeEvent) => ({
      id: e.id,
      type: "event",
      timestamp: e.timestamp,
      title: `Event: ${e.eventType}`,
      details: e.description || "Logged life event",
    }));

    const combined = [...formattedReadings, ...formattedEvents];
    combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return combined;
  }, [twinQuery.data]);

  // Filter history feed based on user controls
  const filteredHistoryFeed = useMemo(() => {
    let result = historyFeed;

    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      let limitMs = 0;

      if (dateFilter === "today") limitMs = oneDay;
      else if (dateFilter === "7days") limitMs = 7 * oneDay;
      else if (dateFilter === "30days") limitMs = 30 * oneDay;

      result = result.filter((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        return now - itemTime <= limitMs;
      });
    }

    return result;
  }, [historyFeed, typeFilter, dateFilter]);

  const saveLog = useCallback(
    async (data: RecordReadingInput) => {
      return recordMutation.mutateAsync(data);
    },
    [recordMutation]
  );

  return {
    historyFeed: filteredHistoryFeed,
    rawCount: historyFeed.length,
    isLoadingHistory: twinQuery.isLoading,
    isHistoryError: twinQuery.isError,
    historyError: twinQuery.error,
    saveLog,
    isSaving: recordMutation.isPending,
    isSaveSuccess: recordMutation.isSuccess,
    saveError: recordMutation.error,
    resetSaveState: recordMutation.reset,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
  };
}
