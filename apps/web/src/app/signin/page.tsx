"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { Heart, User, Stethoscope, Loader2, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "clinician">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsPending(true);
    try {
      await login(email, password, role);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
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
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your CarePulse account
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
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === "patient"
                    ? "maria@carepulse.demo"
                    : "sarah.chen@carepulse.demo"
                }
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex w-full items-center justify-center gap-2 py-2.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign up
            </button>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Demo: maria@carepulse.demo / demo1234 (Patient)
          <br />
          sarah.chen@carepulse.demo / demo1234 (Clinician)
        </p>
      </div>
    </div>
  );
}
