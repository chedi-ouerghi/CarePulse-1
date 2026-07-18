"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X
} from "lucide-react";

const navLinks = [
  { href: "/clinician/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clinician/patients", label: "Patients", icon: Users },
];

export default function ClinicianLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = user?.name?.replace(/^Dr\.\s*/, "") || "";
  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DR";

  return (
    <div className="flex h-screen bg-[#f5f7fa]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-[#e2e8f0] bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#e2e8f0] px-5">
          <Link href="/clinician/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
              <Image src="/logo.jpg" alt="CarePulse" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#0f172a]">CarePulse</span>
              <p className="text-[10px] font-medium text-[#94a3b8] tracking-wide uppercase">Clinician</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const isSubPage = !isActive && pathname.startsWith("/clinician/") &&
              navLinks.every(l => l.href !== href || !pathname.startsWith(href));
            const effectiveActive = isActive || (label === "Patients" && pathname.includes("/clinician/report"));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${effectiveActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                  }`}
              >
                <Icon className={`h-4 w-4 ${effectiveActive ? "text-white" : "text-[#94a3b8]"}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#e2e8f0] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-blue-700 shadow-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0f172a]">
                Dr. {displayName}
              </p>
              <p className="truncate text-xs text-[#94a3b8]">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b] transition-all duration-150"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="fixed bottom-5 left-5 z-10 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-500/30 active:scale-95 transition-all duration-150"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
