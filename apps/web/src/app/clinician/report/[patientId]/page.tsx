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
} from "lucide-react";

export default function ClinicianReportPage({
  params,
}: {
  params: { patientId: string };
}) {
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

  const generateReportMutation = useMutation({
    mutationFn: () => queries.agents.runBrief(patientId, undefined, 90),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", patientId] });
    },
  });

  const readmissionMutation = useMutation({
    mutationFn: () =>
      queries.agents.predictReadmission({
        age: 65,
        race: "Caucasian",
        gender: "Female",
        time_in_hospital: 4,
        num_lab_procedures: 35,
        num_procedures: 1,
        num_medications: 12,
        number_outpatient: 0,
        number_emergency: 0,
        number_inpatient: 0,
        number_diagnoses: 9,
        change: "Ch",
        diabetes_med: "Yes",
      }),
    onError: () => {
      // Keep the doctor page usable even if the Python risk service is unavailable.
    },
  });

  const latestReport = reportsQuery.data?.[0];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <a
          href="/clinician/dashboard"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </a>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Clinical Report
          </h1>
          <p className="mt-1 text-gray-600">
            {patientQuery.data
              ? `Pre-visit summary for ${patientQuery.data.name}`
              : `Patient: ${patientId}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={() => readmissionMutation.mutate()}
          disabled={readmissionMutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
        >
          {readmissionMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Activity className="h-4 w-4" />
          )}
          {readmissionMutation.isPending ? "Scoring..." : "Run Readmission Agent"}
        </button>
        <button
          onClick={() => generateReportMutation.mutate()}
          disabled={generateReportMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {generateReportMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {generateReportMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            Error: {(generateReportMutation.error as Error).message}
          </p>
        </div>
      )}

      {readmissionMutation.isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">
            Readmission agent is currently unavailable; the clinician page remains usable and the report workflow is still available.
          </p>
        </div>
      )}

      {readmissionMutation.data && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                30-day Readmission Risk
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900">
                {(readmissionMutation.data.riskScore * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold capitalize text-amber-700 shadow-sm">
              {readmissionMutation.data.riskLevel || "unknown"}
            </div>
          </div>
        </div>
      )}

      {latestReport ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <h2 className="mb-2 text-sm font-medium text-blue-600">HEADLINE</h2>
            <p className="text-lg font-semibold text-blue-900">
              {latestReport.headline || latestReport.title || "Clinical Report"}
            </p>
            <p className="mt-2 text-xs text-blue-500">
              Generated: {new Date(latestReport.generatedAt || latestReport.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card text-center">
              <Target className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-2xl font-bold capitalize text-gray-900">
                {latestReport.status || "completed"}
              </p>
            </div>
            <div className="card text-center">
              <TrendingUp className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <p className="text-xs text-gray-500">Risk Level</p>
              <p className="text-2xl font-bold capitalize text-gray-900">
                {latestReport.riskLevel || "—"}
              </p>
            </div>
            <div className="card text-center">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-500" />
              <p className="text-xs text-gray-500">Period</p>
              <p className="text-2xl font-bold text-gray-900">
                {latestReport.periodDays || 90}d
              </p>
            </div>
          </div>

          {latestReport.summary && (
            <div className="card">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Summary</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {typeof latestReport.summary === "string"
                  ? latestReport.summary
                  : JSON.stringify(latestReport.summary, null, 2)}
              </p>
            </div>
          )}

          {latestReport.keyFindings && (
            <div className="card">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Key Findings</h2>
              <ul className="space-y-2">
                {(Array.isArray(latestReport.keyFindings) ? latestReport.keyFindings : []).map(
                  (finding: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                      {finding}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {latestReport.recommendations && (
            <div className="card">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Recommendations</h2>
              <ul className="space-y-2">
                {(Array.isArray(latestReport.recommendations) ? latestReport.recommendations : []).map(
                  (rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                      {rec}
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
            No reports generated yet. Click &quot;Generate Report&quot; to create one.
          </p>
        </div>
      )}

      {reportsQuery.data && reportsQuery.data.length > 1 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Previous Reports</h2>
          <div className="space-y-2">
            {reportsQuery.data.slice(1).map((report: any) => (
              <div
                key={report.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
              >
                <div>
                  <p className="text-sm text-gray-700">
                    {report.headline || report.title || "Report"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(report.generatedAt || report.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{report.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
