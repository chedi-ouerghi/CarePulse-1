"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { queries } from "@/lib/api";
import { Loader2, FileText } from "lucide-react";
import Link from "next/link";

export default function ClinicianReportsPage() {
  const { user } = useAuth();

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => queries.patients.list(),
    enabled: !!user,
  });

  const patients = patientsQuery.data || [];

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 animate-fadeIn">
          <p className="text-xs font-medium text-[#94a3b8] tracking-wider uppercase">Reports</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">Clinical Reports</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Review and generate patient reports</p>
        </div>

        {patientsQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#94a3b8]" />
          </div>
        ) : patients.length === 0 ? (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-12 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-12 w-12 text-[#cbd5e1]" />
            <p className="text-lg font-semibold text-[#64748b]">No patients available</p>
            <p className="text-sm text-[#94a3b8] mt-1">Add patients first to generate reports</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient: any, i: number) => (
              <Link
                key={patient.id}
                href={`/clinician/report/${patient.id}`}
                className="group rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-blue-200 active:scale-[0.98] animate-slideUp"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 text-sm font-bold">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0f172a] group-hover:text-blue-600 transition-colors">
                      {patient.name}
                    </p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">{patient.email}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-1.5 ${patient.diabetesType === "type1" ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"}`}>
                      {patient.diabetesType === "type1" ? "Type 1" : "Type 2"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>Open report</span>
                  <span className="text-blue-500 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
