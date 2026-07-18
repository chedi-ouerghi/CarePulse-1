"use client";

import { useAuth } from "@/components/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queries } from "@/lib/api";
import {
  Users,
  FileText,
  Loader2,
  LogOut,
  UserPlus,
  Eye, AlertTriangle
} from "lucide-react";

export default function ClinicianDashboard() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => queries.patients.list(),
    enabled: !!user,
  });

  const createPatientMutation = useMutation({
    mutationFn: () =>
      queries.patients.create({
        name: "New Patient",
        email: `patient-${Date.now()}@carepulse.demo`,
        diabetesType: "type2",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              CP
            </div>
            <span className="text-xl font-bold text-gray-900">CarePulse</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:inline">
              Dr. {user?.name?.replace(/^Dr\.\s*/, "")}
            </span>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Clinician Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Manage your patients and generate clinical briefs
              </p>
            </div>
            <button
              onClick={() => createPatientMutation.mutate()}
              disabled={createPatientMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {createPatientMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Add Patient
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Total Patients"
              value={patientsQuery.data?.length?.toString() || "0"}
              color="text-primary-600"
            />
            <StatCard
              icon={<FileText className="h-5 w-5" />}
              label="Clinical Reports"
              value="—"
              color="text-success-600"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Active Alerts"
              value="—"
              color="text-warning-600"
            />
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Patient List
            </h2>
            {patientsQuery.isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
              </div>
            ) : patientsQuery.data?.length === 0 ? (
              <div className="text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No patients yet. Add one above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-medium text-gray-500">Name</th>
                      <th className="pb-3 font-medium text-gray-500">Email</th>
                      <th className="pb-3 font-medium text-gray-500">Type</th>
                      <th className="pb-3 font-medium text-gray-500">Joined</th>
                      <th className="pb-3 text-right font-medium text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {patientsQuery.data?.map((patient: any) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium text-gray-900">
                          {patient.name}
                        </td>
                        <td className="py-3 text-gray-500">{patient.email}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${patient.diabetesType === "type1"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                              }`}
                          >
                            {patient.diabetesType === "type1"
                              ? "Type 1"
                              : "Type 2"}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400">
                          {new Date(patient.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/clinician/report/${patient.id}`}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                              title="View Reports"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                            <a
                              href={`/clinician/patient/${patient.id}`}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-primary-600"
                              title="View Patient"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-gray-100 p-2 ${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
