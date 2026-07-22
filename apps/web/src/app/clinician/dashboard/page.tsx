"use client";

import { useAuth } from "@/components/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import { useState } from "react";
import {
  Users,
  FileText,
  Loader2,
  UserPlus,
  AlertTriangle,
  Activity,
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Shield,
  Thermometer,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import Link from "next/link";

const SEVERITY_COLORS: Record<string, string> = {
  low: "#94a3b8",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function ClinicianDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => queries.patients.list(),
    enabled: !!user,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: () => queries.alerts.list(),
    enabled: !!user,
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDiabetes, setFormDiabetes] = useState<"TYPE_1" | "TYPE_2">("TYPE_2");

  const createPatientMutation = useMutation({
    mutationFn: (data: { name: string; email: string; diabetesType: string }) =>
      queries.patients.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setShowAddModal(false);
      setFormName("");
      setFormEmail("");
      setFormDiabetes("TYPE_2");
    },
  });

  const patients = patientsQuery.data || [];
  const activeAlerts = (alertsQuery.data || []).filter((a: any) => a.status === "active");

  const riskDistribution = [
    { name: "Low Risk", value: patients.filter((p: any) => !p.overallRisk || p.overallRisk === "low").length || 0 },
    { name: "Medium Risk", value: patients.filter((p: any) => p.overallRisk === "medium").length || 0 },
    { name: "High Risk", value: patients.filter((p: any) => p.overallRisk === "high" || p.overallRisk === "very_high").length || 0 },
  ];

  const alertSeverityData = [
    { name: "Critical", value: activeAlerts.filter((a: any) => a.severity === "critical").length, fill: "#dc2626" },
    { name: "High", value: activeAlerts.filter((a: any) => a.severity === "high").length, fill: "#ef4444" },
    { name: "Medium", value: activeAlerts.filter((a: any) => a.severity === "medium").length, fill: "#f59e0b" },
    { name: "Low", value: activeAlerts.filter((a: any) => a.severity === "low").length, fill: "#94a3b8" },
  ];

  const typeDistribution = [
    { name: "Type 1", value: patients.filter((p: any) => p.diabetesType === "TYPE_1").length },
    { name: "Type 2", value: patients.filter((p: any) => p.diabetesType === "TYPE_2").length },
  ];

  const alertCount = activeAlerts.length;

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h1 className="text-sm font-semibold text-[#0f172a]">Clinician Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            {alertCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {alertCount} alert{alertCount > 1 ? "s" : ""}
              </div>
            )}
            <span className="text-sm text-[#94a3b8]">Dr. {user?.name?.replace(/^Dr\.\s*/, "").split(" ")[0]}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="space-y-6">
          {/* Welcome */}
          <div className="flex items-end justify-between animate-fadeIn">
            <div>
              <p className="text-xs font-medium text-[#94a3b8] tracking-wider uppercase">Overview</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">
                Welcome, Dr. {user?.name?.replace(/^Dr\.\s*/, "").split(" ")[0]}
              </h2>
              <p className="mt-0.5 text-sm text-[#64748b]">Manage your patients and review clinical insights</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all duration-150 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 active:scale-95"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Users className="h-4 w-4" />}
              label="Total Patients"
              value={patients.length.toString()}
              gradient="from-blue-600 to-cyan-600"
              delay="stagger-1"
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              label="Type 1 / Type 2"
              value={`${typeDistribution[0].value} / ${typeDistribution[1].value}`}
              gradient="from-emerald-500 to-green-500"
              delay="stagger-2"
            />
            <StatCard
              icon={<FileText className="h-4 w-4" />}
              label="Clinical Reports"
              value={patients.length.toString()}
              gradient="from-orange-500 to-amber-500"
              delay="stagger-3"
            />
            <StatCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Active Alerts"
              value={alertCount.toString()}
              gradient={alertCount > 0 ? "from-red-500 to-rose-500" : "from-slate-500 to-slate-400"}
              delay="stagger-4"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Risk Distribution */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#0f172a]">Risk Distribution</h3>
              </div>
              {patients.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskDistribution.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.95)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-[#94a3b8]">No patient data</div>
              )}
              <div className="flex justify-center gap-4 mt-2">
                {riskDistribution.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>

            {/* Diabetes Type */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-sm">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#0f172a]">Diabetes Type Breakdown</h3>
              </div>
              {patients.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={typeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {typeDistribution.map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? "#3b82f6" : "#06b6d4"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-[#94a3b8]">No patient data</div>
              )}
            </div>

            {/* Alert Severity */}
            <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm animate-fadeIn stagger-3">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-[#0f172a]">Alert Severity</h3>
              </div>
              {alertCount > 0 ? (
                <div className="space-y-3">
                  {alertSeverityData.filter(a => a.value > 0).map((a) => (
                    <div key={a.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#64748b]">{a.name}</span>
                        <span className="text-xs font-semibold text-[#0f172a]">{a.value}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(a.value / alertCount) * 100}%`, backgroundColor: a.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[200px] items-center justify-center text-sm text-[#94a3b8]">No active alerts</div>
              )}
            </div>
          </div>

          {/* Patient List */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm shadow-sm animate-fadeIn stagger-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="section-title">Patient Overview</h3>
              </div>
              <Link
                href="/clinician/patients"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="p-5">
              {patientsQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#94a3b8]" />
                </div>
              ) : patients.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-[#cbd5e1]" />
                  <p className="text-sm font-medium text-[#94a3b8]">No patients yet</p>
                  <p className="text-xs text-[#cbd5e1] mt-0.5">Add a patient to get started</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {patients.slice(0, 9).map((patient: any, i: number) => (
                    <PatientCard key={patient.id} patient={patient} index={i} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3.5">
              <h3 className="text-sm font-semibold text-[#0f172a]">Add New Patient</h3>
              <button onClick={() => setShowAddModal(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!formName || !formEmail) return;
                createPatientMutation.mutate({ name: formName, email: formEmail, diabetesType: formDiabetes });
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Full Name</label>
                <input
                  type="text" required value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Enter patient name"
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Email</label>
                <input
                  type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full rounded-xl border border-[#e2e8f0] px-3 py-2.5 text-sm placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[#64748b]">Diabetes Type</label>
                <div className="flex gap-3">
                  <button
                    type="button" onClick={() => setFormDiabetes("TYPE_1")}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${formDiabetes === "TYPE_1" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"}`}
                  >
                    Type 1
                  </button>
                  <button
                    type="button" onClick={() => setFormDiabetes("TYPE_2")}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-colors ${formDiabetes === "TYPE_2" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"}`}
                  >
                    Type 2
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={createPatientMutation.isPending || !formName || !formEmail}
                  className="flex-1 rounded-xl py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {createPatientMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    "Add Patient"
                  )}
                </button>
              </div>
              {createPatientMutation.isError && (
                <p className="text-xs text-red-600 text-center">{(createPatientMutation.error as Error).message}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, gradient, delay }: {
  icon: React.ReactNode; label: string; value: string; gradient: string; delay: string;
}) {
  return (
    <div className={`rounded-2xl border border-[#e2e8f0] bg-white/80 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#cbd5e1] hover:scale-[1.02] animate-fadeIn ${delay}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-2.5 bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="stat-label">{label}</p>
          <p className="text-xl font-bold tracking-tight text-[#0f172a] mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function PatientCard({ patient, index }: { patient: any; index: number }) {
  const riskColorMap: Record<string, string> = {
    high: "bg-red-100 text-red-700 border-red-200",
    very_high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const riskLevel = patient.overallRisk || "low";
  const colorClass = riskColorMap[riskLevel] || riskColorMap.low;

  const isType1 = patient.diabetesType === "TYPE_1";
  const patientName = typeof patient?.name === "string" && patient.name.trim() ? patient.name : "Unknown Patient";

  return (
    <Link
      href={`/clinician/report/${patient.id}`}
      className={`group rounded-xl border border-[#e2e8f0] bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-blue-200 active:scale-[0.98] animate-slideUp`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-blue-700">
            {patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f172a] group-hover:text-blue-600 transition-colors">{patientName}</p>
            <p className="text-xs text-[#94a3b8]">{patient.email}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}>
          {riskLevel.replace("_", " ").toUpperCase()}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${isType1 ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"}`}>
          {isType1 ? "Type 1" : "Type 2"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(patient.createdAt).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
