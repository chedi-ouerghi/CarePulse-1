"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { queries } from "@/lib/api";
import { Loader2, Search, Users, FileText, Eye, Clock } from "lucide-react";
import Link from "next/link";

export default function ClinicianPatientsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => queries.patients.list(),
    enabled: !!user,
  });

  const patients = (patientsQuery.data || []).filter((p: any) => {
    const patientName = typeof p?.name === "string" && p.name.trim() ? p.name : "Unknown Patient";
    return !search || patientName.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 animate-fadeIn">
          <p className="text-xs font-medium text-[#94a3b8] tracking-wider uppercase">Patients</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">All Patients</h1>
          <p className="mt-0.5 text-sm text-[#64748b]">Browse and manage your assigned patients</p>
        </div>

        <div className="mb-6 animate-fadeIn stagger-1">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e2e8f0] bg-white/80 pl-10 pr-4 py-2.5 text-sm text-[#0f172a] placeholder-[#94a3b8] transition-all duration-150 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
          </div>
        </div>

        {patientsQuery.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#94a3b8]" />
          </div>
        ) : patientsQuery.data?.length === 0 ? (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-12 text-center shadow-sm">
            <Users className="mx-auto mb-4 h-12 w-12 text-[#cbd5e1]" />
            <p className="text-lg font-semibold text-[#64748b]">No patients assigned</p>
            <p className="text-sm text-[#94a3b8] mt-1">Add a patient from the dashboard to get started</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm shadow-sm animate-fadeIn stagger-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="px-5 py-3.5 font-medium text-[#94a3b8] text-xs uppercase tracking-wider">Patient</th>
                    <th className="px-5 py-3.5 font-medium text-[#94a3b8] text-xs uppercase tracking-wider">Diabetes</th>
                    <th className="px-5 py-3.5 font-medium text-[#94a3b8] text-xs uppercase tracking-wider">Risk Level</th>
                    <th className="px-5 py-3.5 font-medium text-[#94a3b8] text-xs uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3.5 text-right font-medium text-[#94a3b8] text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {patients.map((patient: any) => {
                    const riskLevel = patient.overallRisk || "low";
                    const riskColor =
                      riskLevel === "high" || riskLevel === "very_high"
                        ? "bg-red-100 text-red-700"
                        : riskLevel === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700";
                    const isType1 = patient.diabetesType === "type1";
                    const patientName = typeof patient?.name === "string" && patient.name.trim() ? patient.name : "Unknown Patient";
                    return (
                      <tr key={patient.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-blue-700">
                              {patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-[#0f172a]">{patientName}</p>
                              <p className="text-xs text-[#94a3b8]">{patient.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isType1 ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"}`}>
                            {isType1 ? "Type 1" : "Type 2"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskColor}`}>
                            {riskLevel.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#94a3b8]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {new Date(patient.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/clinician/report/${patient.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Report
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
