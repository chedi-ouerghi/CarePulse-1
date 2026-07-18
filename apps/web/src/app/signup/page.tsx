"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { User, Stethoscope, Loader2, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "clinician">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [diabetesType, setDiabetesType] = useState<"type1" | "type2">("type2");
  const [specialty, setSpecialty] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        diabetesType: role === "patient" ? diabetesType : undefined,
        specialty: role === "clinician" ? specialty : undefined,
      });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white shadow-lg"
          >
            CP
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join CarePulse today
          </p>
        </div>

        <div className="card">
          <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setRole("patient")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
                role === "patient"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="h-4 w-4" />
              Patient
            </button>
            <button
              onClick={() => setRole("clinician")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${
                role === "clinician"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Clinician
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            {role === "patient" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Diabetes Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDiabetesType("type1")}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      diabetesType === "type1"
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Type 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiabetesType("type2")}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      diabetesType === "type2"
                        ? "border-primary-300 bg-primary-50 text-primary-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Type 2
                  </button>
                </div>
              </div>
            )}

            {role === "clinician" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Endocrinology, Primary Care"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex w-full items-center justify-center gap-2 py-2.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/signin")}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
