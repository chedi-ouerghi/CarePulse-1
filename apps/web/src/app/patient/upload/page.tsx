"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowUpFromLine,
  FileSpreadsheet,
} from "lucide-react";

const ACCEPTED_TYPES = [
  { value: "glucose", label: "Glucose Data (.csv)", accept: ".csv" },
  { value: "events", label: "Life Events (.csv, .json)", accept: ".csv,.json" },
] as const;

export default function PatientUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("glucose");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: () => queries.ingestion.upload(user!.id, file!, fileType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twin", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["analyses", user?.id] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const accepted = ACCEPTED_TYPES.find((t) => t.value === fileType)?.accept;

  return (
    <div className="min-h-full bg-[#fafafa]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-medium text-[#a3a3a3] tracking-wider uppercase">
            Data Management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0a0a0b]">
            Upload Health Data
          </h1>
          <p className="mt-1 text-sm text-[#737373]">
            Import glucose readings or life events from your devices or
            exported files.
          </p>
        </div>

        {/* File type selector */}
        <div className="mb-6">
          <label className="stat-label mb-2 block">Data Type</label>
          <div className="flex gap-2">
            {ACCEPTED_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setFileType(t.value);
                  setFile(null);
                }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                  fileType === t.value
                    ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                    : "border-[#e5e5e5] bg-white text-[#525252] hover:border-[#d4d4d4] hover:bg-[#fafafa]"
                }`}
              >
                {t.value === "glucose" ? (
                  <FileSpreadsheet className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-150 ${
            dragOver
              ? "border-[#2563eb] bg-[#eff6ff]"
              : file
                ? "border-[#16a34a] bg-[#f0fdf4]"
                : "border-[#e5e5e5] bg-white hover:border-[#a3a3a3] hover:bg-[#fafafa]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accepted}
            onChange={handleFileSelect}
            className="hidden"
          />
          {file ? (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0fdf4]">
                <CheckCircle2 className="h-6 w-6 text-[#16a34a]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0a0a0b]">
                  {file.name}
                </p>
                <p className="text-xs text-[#737373]">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-[#737373] hover:text-[#dc2626] transition-colors"
              >
                <X className="h-3 w-3" />
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f5] group-hover:bg-[#eff6ff] transition-colors">
                <ArrowUpFromLine className="h-6 w-6 text-[#a3a3a3] group-hover:text-[#2563eb] transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0a0a0b]">
                  <span className="text-[#2563eb]">Click to upload</span> or
                  drag and drop
                </p>
                <p className="mt-0.5 text-xs text-[#a3a3a3]">
                  {fileType === "glucose"
                    ? "CSV files with glucose readings"
                    : "CSV or JSON files with life events"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className="mt-6">
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
            className="btn-primary-apple w-full"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {fileType === "glucose" ? "Glucose Data" : "Life Events"}
              </>
            )}
          </button>
        </div>

        {/* Success / Error */}
        {uploadMutation.isSuccess && (
          <div className="mt-4 animate-fadeIn rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
              <p className="text-sm font-medium text-[#166534]">
                Data uploaded successfully!
              </p>
            </div>
            <p className="mt-0.5 text-xs text-[#16a34a]">
              Your glucose data is being processed and will appear in your
              dashboard shortly.
            </p>
          </div>
        )}

        {uploadMutation.isError && (
          <div className="mt-4 animate-fadeIn rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#dc2626]" />
              <p className="text-sm font-medium text-[#991b1b]">
                Upload failed
              </p>
            </div>
            <p className="mt-0.5 text-xs text-[#dc2626]">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "An unexpected error occurred. Please try again."}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 rounded-xl border border-[#e5e5e5] bg-white p-5">
          <h3 className="section-title mb-2">Supported Formats</h3>
          <ul className="space-y-1.5 text-sm text-[#737373]">
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[#d4d4d4]" />
              <span>
                <strong className="text-[#525252]">Glucose CSV:</strong>{" "}
                Columns should include timestamp and value (mg/dL)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[#d4d4d4]" />
              <span>
                <strong className="text-[#525252]">Life Events CSV:</strong>{" "}
                Columns for timestamp, event type, and optional notes
              </span>
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-[#d4d4d4]" />
              <span>
                <strong className="text-[#525252]">Life Events JSON:</strong>{" "}
                Array of objects with timestamp, type, and notes fields
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
