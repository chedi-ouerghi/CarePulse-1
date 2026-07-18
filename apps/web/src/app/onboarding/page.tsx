"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"glucose" | "events">("glucose");
  const [patientId, setPatientId] = useState("");
  const [uploadResult, setUploadResult] = useState<any>(null);

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile || !patientId) throw new Error("Missing data");
      return queries.ingestion.upload(patientId, selectedFile, fileType);
    },
    onSuccess: (data) => {
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: ["twin", patientId] });
    },
  });

  const createPatientMutation = useMutation({
    mutationFn: () =>
      queries.patients.create({
        name: "New Patient",
        email: `patient-${Date.now()}@carepulse.demo`,
        diabetesType: "type2",
      }),
    onSuccess: (data) => {
      setPatientId(data.id);
    },
  });

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) setSelectedFile(file);
    },
    []
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) setSelectedFile(file);
    },
    []
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Data Onboarding</h1>
        <p className="mt-2 text-gray-600">
          Upload your CGM data or life events to build your digital twin.
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          1. Select or Create Patient
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={() => createPatientMutation.mutate()}
            disabled={createPatientMutation.isPending}
            className="btn-secondary"
          >
            {createPatientMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create New"
            )}
          </button>
        </div>
        {createPatientMutation.data && (
          <p className="mt-2 text-sm text-success-600">
            Patient created: {createPatientMutation.data.name} (
            {createPatientMutation.data.id})
          </p>
        )}
      </div>

      <div className="card mb-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          2. Upload Data
        </h2>

        <div className="mb-4 flex gap-3">
          <button
            onClick={() => setFileType("glucose")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              fileType === "glucose"
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FileText className="mr-1 inline h-4 w-4" />
            Glucose Data
          </button>
          <button
            onClick={() => setFileType("events")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              fileType === "events"
                ? "bg-primary-100 text-primary-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <FileText className="mr-1 inline h-4 w-4" />
            Life Events
          </button>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-primary-400 hover:bg-primary-50 transition-colors cursor-pointer"
        >
          <Upload className="mb-4 h-10 w-10 text-gray-400" />
          {selectedFile ? (
            <p className="text-sm text-gray-900">
              Selected: <strong>{selectedFile.name}</strong> (
              {(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drag and drop your file here, or{" "}
                <label className="cursor-pointer text-primary-600 hover:underline">
                  browse
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={onFileSelect}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supports CSV and JSON (Nightscout format)
              </p>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || !patientId || uploadMutation.isPending}
            className="btn-primary"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Data"
            )}
          </button>
        </div>
      </div>

      {uploadMutation.isError && (
        <div className="card mb-6 border-danger-200 bg-danger-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-danger-600" />
            <p className="text-sm text-danger-700">
              Upload failed: {(uploadMutation.error as Error).message}
            </p>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className="card border-success-200 bg-success-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success-600" />
            <div>
              <p className="text-sm font-medium text-success-700">
                Upload successful!
              </p>
              <p className="text-xs text-success-600">
                {uploadResult.ingested} {uploadResult.type} records ingested
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
