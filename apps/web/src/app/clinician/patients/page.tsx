"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { queries } from "@/lib/api";
import { Loader2, UserCircle2 } from "lucide-react";
import Link from "next/link";

export default function ClinicianPatientsPage() {
    const { user } = useAuth();
    const patientsQuery = useQuery({
        queryKey: ["patients"],
        queryFn: () => queries.patients.list(),
        enabled: !!user,
    });

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                <p className="mt-1 text-gray-600">Browse the patients assigned to your clinic.</p>
            </div>

            {patientsQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {(patientsQuery.data || []).map((patient: any) => (
                        <Link
                            key={patient.id}
                            href={`/clinician/report/${patient.id}`}
                            className="card flex items-center gap-3 hover:border-primary-300"
                        >
                            <div className="rounded-full bg-primary-100 p-2 text-primary-700">
                                <UserCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{patient.name}</p>
                                <p className="text-sm text-gray-500">{patient.email}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
