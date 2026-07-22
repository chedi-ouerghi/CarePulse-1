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
  UploadCloud,
} from "lucide-react";

const ACCEPTED_TYPES = [
  { value: "glucose", label: "Glucose Data", icon: FileSpreadsheet, desc: ".csv" },
  { value: "events", label: "Life Events", icon: FileText, desc: ".csv, .json" },
] as const;

export default function PatientUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("glucose");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: () => queries.ingestion.upload(user!.profileId!, file!, fileType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twin", user?.profileId] });
      queryClient.invalidateQueries({ queryKey: ["analyses", user?.profileId] });
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

  const selectedType = ACCEPTED_TYPES.find((t) => t.value === fileType);

  return (
    <div className="min-h-full bg-gradient-to-br from-[#f8faff] via-white to-[#f0f7ff]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <p className="text-xs font-medium text-[#a3a3a3] tracking-wider uppercase">
            Data Management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0a0a0b]">
            Upload Health Data
          </h1>
          <p className="mt-1 text-sm text-[#737373]">
            Import glucose readings or life events from your devices or exported files.
          </p>
        </div>

        {/* File type selector */}
        <div className="mb-6 animate-fadeIn stagger-1">
          <label className="stat-label mb-2.5 block">Data Type</label>
          <div className="flex gap-2">
            {ACCEPTED_TYPES.map((t, i) => {
              const Icon = t.icon;
              const isActive = fileType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    setFileType(t.value);
                    setFile(null);
                  }}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                       ? "border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 shadow-sm shadow-blue-500/10"
                      : "border-[#e5e5e5] bg-white/80 text-[#525252] hover:border-[#d4d4d4] hover:bg-[#fafafa]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-primary-500" : "text-[#a3a3a3]"
                    }`}
                  />
                  <span>
                    {t.label}
                    <br />
                    <span className={`text-[10px] ${isActive ? "text-primary-400" : "text-[#d4d4d4]"}`}>
                      {t.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-all duration-200 ${
            dragOver
               ? "border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-lg shadow-blue-500/10 scale-[1.01]"
              : file
              ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-500/10"
              : "border-[#e5e5e5] bg-white/60 hover:border-[#a3a3a3] hover:bg-white/80 hover:shadow-md"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={selectedType?.value === "glucose" ? ".csv" : ".csv,.json"}
            onChange={handleFileSelect}
            className="hidden"
          />
          {file ? (
            <div className="space-y-4 animate-scaleIn">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0a0a0b]">
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
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-[#737373] hover:bg-[#fef2f2] hover:text-[#dc2626] transition-all duration-150"
              >
                <X className="h-3 w-3" />
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f0f0f0] to-[#e5e5e5] group-hover:from-blue-100 group-hover:to-cyan-100 transition-all duration-300 shadow-inner">
                <UploadCloud className="h-7 w-7 text-[#a3a3a3] group-hover:text-primary-500 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0a0a0b]">
                  <span className="text-primary-500 font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-[#a3a3a3]">
                  {selectedType?.label} &mdash; {selectedType?.desc}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload button */}
        <div className="mt-6 animate-fadeIn stagger-2">
          <button
            onClick={() => uploadMutation.mutate()}
            disabled={!file || uploadMutation.isPending}
            className="btn-primary-apple w-full py-3 text-sm"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {selectedType?.label}
              </>
            )}
          </button>
        </div>

        {/* Progress */}
        {uploadMutation.isPending && (
          <div className="mt-4 animate-fadeIn">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-shimmer" />
            </div>
          </div>
        )}

        {/* Success */}
        {uploadMutation.isSuccess && (
          <div className="mt-4 animate-slideDown rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#166534]">
                  Data uploaded successfully!
                </p>
                <p className="text-xs text-[#16a34a]">
                  Your data is being processed and will appear in your dashboard shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {uploadMutation.isError && (
          <div className="mt-4 animate-slideDown rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#991b1b]">Upload failed</p>
                <p className="text-xs text-[#dc2626]">
                  {uploadMutation.error instanceof Error
                    ? uploadMutation.error.message
                    : "An unexpected error occurred. Please try again."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 animate-fadeIn stagger-3">
          <div className="rounded-xl border border-[#e5e5e5]/60 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
            <h3 className="section-title mb-3">Supported Formats</h3>
            <ul className="space-y-2 text-sm text-[#737373]">
              <li className="flex items-start gap-2.5">
                <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                <div>
                  <span className="font-medium text-[#525252]">Glucose CSV:</span>{" "}
                  Columns should include timestamp and value (mg/dL)
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                <div>
                  <span className="font-medium text-[#525252]">Life Events CSV:</span>{" "}
                  Columns for timestamp, event type, and optional notes
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="mt-1.5 flex h-2 w-2 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-500" />
                <div>
                  <span className="font-medium text-[#525252]">Life Events JSON:</span>{" "}
                  Array of objects with timestamp, type, and notes fields
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
