"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, queries, type AuthUser } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role: "patient" | "clinician") => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: "patient" | "clinician";
    diabetesType?: string;
    specialty?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ["/signin", "/signup"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem("carepulse_token");
    const storedUser = localStorage.getItem("carepulse_user");

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setToken(storedToken);
        setUser(parsed);
        api.setToken(storedToken);
      } catch {
        localStorage.removeItem("carepulse_token");
        localStorage.removeItem("carepulse_user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublic) {
      router.push("/signin");
    } else if (user && isPublic) {
      const redirectPath = user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard";
      router.push(redirectPath);
    }
  }, [user, isLoading, pathname, router]);

  const login = useCallback(
    async (email: string, password: string, role: "patient" | "clinician") => {
      const response =
        role === "patient"
          ? await queries.auth.loginPatient(email, password)
          : await queries.auth.loginClinician(email, password);

      setToken(response.access_token);
      setUser(response.user);
      api.setToken(response.access_token);
      localStorage.setItem("carepulse_token", response.access_token);
      localStorage.setItem("carepulse_user", JSON.stringify(response.user));

      const redirectPath = response.user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard";
      router.push(redirectPath);
    },
    [router]
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      role: "patient" | "clinician";
      diabetesType?: string;
      specialty?: string;
    }) => {
      const response =
        data.role === "patient"
          ? await queries.auth.registerPatient({
              name: data.name,
              email: data.email,
              password: data.password,
              diabetesType: data.diabetesType || "type2",
            })
          : await queries.auth.registerClinician({
              name: data.name,
              email: data.email,
              password: data.password,
              specialty: data.specialty,
            });

      setToken(response.access_token);
      setUser(response.user);
      api.setToken(response.access_token);
      localStorage.setItem("carepulse_token", response.access_token);
      localStorage.setItem("carepulse_user", JSON.stringify(response.user));

      const redirectPath = response.user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard";
      router.push(redirectPath);
    },
    [router]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    localStorage.removeItem("carepulse_token");
    localStorage.removeItem("carepulse_user");
    router.push("/signin");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
