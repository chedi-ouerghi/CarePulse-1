"use client";

import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Heart, Shield, Activity, Users, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const redirectPath = user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard";
        router.push(redirectPath);
      } else {
        router.push("/signin");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white shadow-lg">
            CP
          </div>
        </div>
        <h1 className="mb-4 text-5xl font-bold text-gray-900">CarePulse</h1>
        <p className="mb-8 text-lg text-gray-600">
          AI-powered diabetes digital twin platform
        </p>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Activity className="h-5 w-5" />}
            title="Digital Twin"
            desc="Real-time glucose monitoring and analytics"
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="AI Risk Detection"
            desc="Early diabetes risk screening with ML"
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Care Coordination"
            desc="Seamless patient-clinician collaboration"
          />
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push("/signin")}
            className="btn-primary flex items-center gap-2 px-8 py-3 text-base"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="btn-secondary flex items-center gap-2 px-8 py-3 text-base"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </div>
  );
}
