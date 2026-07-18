"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import {
  FileText,
  TrendingUp,
  Target,
  AlertTriangle,
  MessageSquare,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function ClinicianBriefPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = use(params);
  const queryClient = useQueryClient();

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => queries.patients.get(patientId),
  });

  const briefsQuery = useQuery({
    queryKey: ["briefs", patientId],
    queryFn: () => queries.briefs.listByPatient(patientId),
  });

  const generateBriefMutation = useMutation({
    mutationFn: () => queries.agents.runBrief(patientId, 90),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["briefs", patientId] });
    },
  });

  const latestBrief = briefsQuery.data?.[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <a
          href="/dashboard"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Clinical Brief
          </h1>
          <p className="mt-1 text-gray-600">
            {patientQuery.data
              ? `Pre-visit summary for ${patientQuery.data.name}`
              : `Patient: ${patientId}`}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => generateBriefMutation.mutate()}
          disabled={generateBriefMutation.isPending}
          className="btn-primary"
        >
          {generateBriefMutation.isPending ? (
            <>
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
              Generating Brief...
            </>
          ) : (
            <>
              <FileText className="mr-2 inline h-4 w-4" />
              Generate New Brief
            </>
          )}
        </button>
      </div>

      {generateBriefMutation.isError && (
        <div className="card border-danger-200 bg-danger-50">
          <p className="text-sm text-danger-700">
            Error: {(generateBriefMutation.error as Error).message}
          </p>
        </div>
      )}

      {latestBrief ? (
        <div className="space-y-6">
          <div className="card border-primary-200 bg-primary-50">
            <h2 className="mb-2 text-sm font-medium text-primary-600">
              HEADLINE
            </h2>
            <p className="text-lg font-semibold text-primary-900">
              {latestBrief.content.headline}
            </p>
            <p className="mt-2 text-xs text-primary-500">
              Generated:{" "}
              {new Date(latestBrief.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <Target className="mx-auto mb-2 h-6 w-6 text-success-500" />
              <p className="text-xs text-gray-500">Time in Range</p>
              <p className="text-2xl font-bold text-gray-900">
                {(latestBrief.content.statsSnapshot.timeInRange * 100).toFixed(
                  0
                )}
                %
              </p>
            </div>
            <div className="card text-center">
              <TrendingUp className="mx-auto mb-2 h-6 w-6 text-primary-500" />
              <p className="text-xs text-gray-500">Avg Glucose</p>
              <p className="text-2xl font-bold text-gray-900">
                {latestBrief.content.statsSnapshot.avgGlucose}{" "}
                <span className="text-sm font-normal text-gray-400">
                  mg/dL
                </span>
              </p>
            </div>
            <div className="card text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-danger-500" />
              <p className="text-xs text-gray-500">Hypo Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {latestBrief.content.statsSnapshot.hypoEvents}
              </p>
            </div>
          </div>

          {latestBrief.content.keyPatterns.length > 0 && (
            <div className="card">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Key Patterns
              </h2>
              <div className="space-y-3">
                {latestBrief.content.keyPatterns.map(
                  (p: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          {p.triggerEventType}
                        </span>
                        <span className="text-xs font-medium text-primary-600">
                          {(p.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{p.summary}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {latestBrief.content.suggestedDiscussionPoints.length > 0 && (
            <div className="card">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageSquare className="h-5 w-5 text-primary-500" />
                Suggested Discussion Points
              </h2>
              <ul className="space-y-2">
                {latestBrief.content.suggestedDiscussionPoints.map(
                  (point: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                      {point}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">
            No briefs generated yet. Click &quot;Generate New Brief&quot; to
            create one.
          </p>
        </div>
      )}

      {briefsQuery.data && briefsQuery.data.length > 1 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Previous Briefs
          </h2>
          <div className="space-y-2">
            {briefsQuery.data.slice(1).map((brief: any) => (
              <div
                key={brief.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <p className="text-sm text-gray-700">
                    {brief.content.headline}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(brief.generatedAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{brief.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
