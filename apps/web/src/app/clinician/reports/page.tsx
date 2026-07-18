"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { queries } from "@/lib/api";
import { Loader2, ArrowRight } from "lucide-react";

export default function ClinicianReportsPage() {
    const { user } = useAuth();
    const patientsQuery = useQuery({
        queryKey: ["patients"],
        queryFn: () => queries.patients.list(),
        enabled: !!user,
    });

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Clinician Reports</h1>
                <p className="mt-1 text-gray-600">Review and generate patient reports.</p>
            </div>

            {patientsQuery.isLoading ? (
                <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {(patientsQuery.data || []).map((patient: any) => (
                        <div key={patient.id} className="card flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900">{patient.name}</p>
                                <p className="text-sm text-gray-500">{patient.email}</p>
                            </div>
                            <Link
                                href={`/clinician/report/${patient.id}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                            >
                                Open report
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
