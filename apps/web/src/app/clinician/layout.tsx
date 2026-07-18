"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
} from "lucide-react";

const navLinks = [
  {
    href: "/clinician/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/clinician/reports",
    label: "Reports",
    icon: FileText,
  },
  {
    href: "/clinician/patients",
    label: "Patients",
    icon: Users,
  },
];

export default function ClinicianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const displayName = user?.name?.replace(/^Dr\.\s*/, "") || "";
  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DR";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            CP
          </div>
          <span className="text-lg font-bold text-gray-900">CarePulse</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-primary-600" : "text-gray-400"
                  }`}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                Dr. {displayName}
              </p>
              <p className="truncate text-xs text-gray-400">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
