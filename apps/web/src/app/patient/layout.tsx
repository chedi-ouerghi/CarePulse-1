"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  LayoutDashboard,
  MessageCircle,
  LogOut,
  Menu,
  X, ClipboardList
} from "lucide-react";

const navLinks = [
  {
    href: "/patient/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    href: "/patient/log",
    label: "Log Daily Data",
    icon: ClipboardList,
    gradient: "from-emerald-500 to-green-500",
  },
  {
    href: "/patient/chat",
    label: "AI Chat",
    icon: MessageCircle,
    gradient: "from-blue-600 to-cyan-600",
  },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#f8faff] via-white to-[#f0f7ff]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-[#e5e5e5]/60 bg-white/90 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-[#e5e5e5]/60 px-5">
          <Link href="/patient/dashboard" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-sm">
              <Image
                src="/logo.jpg"
                alt="CarePulse"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#0a0a0b]">
                CarePulse
              </span>
              <p className="text-[10px] font-medium text-[#a3a3a3] tracking-wide uppercase">
                Patient Space
              </p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] hover:bg-[#f5f5f5] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navLinks.map(({ href, label, icon: Icon, gradient }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                    ? `bg-gradient-to-r ${gradient} text-white shadow-lg`
                    : "text-[#737373] hover:bg-[#f5f5f5] hover:text-[#0a0a0b]"
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-white/10" />
                )}
                <Icon
                  className={`relative z-10 h-4 w-4 ${isActive ? "text-white" : "text-[#a3a3a3] group-hover:text-[#2563eb]"
                    } transition-colors`}
                />
                <span className="relative z-10">{label}</span>
                {isActive && (
                  <div className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-[#e5e5e5]/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-bold text-blue-600 shadow-sm ring-1 ring-blue-200/50">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0a0a0b]">
                {user?.name}
              </p>
              <p className="truncate text-xs text-[#a3a3a3]">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#525252] transition-all duration-150"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <div className="fixed bottom-5 left-5 z-10 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-500/30 active:scale-95 transition-all duration-150"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
