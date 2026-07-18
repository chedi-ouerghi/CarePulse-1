"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { User, Stethoscope, Loader2, AlertCircle } from "lucide-react";

export default function SignInPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "clinician">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailError = touched.email && !email ? "Email is required" : "";
  const passwordError = touched.password && !password ? "Password is required" : "";
  const fieldError = emailError || passwordError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!email || !password) return;
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
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-lg"
          >
            <Image src="/logo.jpg" alt="CarePulse" width={48} height={48} className="object-contain" />
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
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${role === "patient"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <User className="h-4 w-4" />
              Patient
            </button>
            <button
              onClick={() => setRole("clinician")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${role === "clinician"
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Email</label>
                {emailError && <span className="text-xs text-danger-600">{emailError}</span>}
              </div>
              <input
                type="email"
                required
                value={email}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === "patient"
                    ? "maria@carepulse.demo"
                    : "sarah.chen@carepulse.demo"
                }
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${emailError
                    ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                    : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  }`}
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                {passwordError && <span className="text-xs text-danger-600">{passwordError}</span>}
              </div>
              <input
                type="password"
                required
                value={password}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1 ${passwordError
                    ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500"
                    : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  }`}
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

      </div>
    </div>
  );
}
