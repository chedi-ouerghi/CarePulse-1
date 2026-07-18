"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  LayoutDashboard,
  MessageCircle,
  Upload,
  LogOut,
  ChevronRight,
} from "lucide-react";

const navLinks = [
  {
    href: "/patient/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/patient/chat",
    label: "Chat",
    icon: MessageCircle,
  }
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-[#e5e5e5] bg-white">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-[#e5e5e5] px-4">
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg">
            <Image
              src="/logo.jpg"
              alt="CarePulse"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-[#0a0a0b]">
            CarePulse
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-[#f5f5f5] text-[#0a0a0b]"
                    : "text-[#737373] hover:bg-[#f5f5f5] hover:text-[#0a0a0b]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-[#2563eb]" : "text-[#a3a3a3]"
                  }`}
                />
                {label}
                {isActive && (
                  <ChevronRight className="absolute right-2 h-3 w-3 text-[#a3a3a3]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-[#e5e5e5] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-xs font-semibold text-[#525252] ring-1 ring-[#e5e5e5]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#0a0a0b]">
                {user?.name}
              </p>
              <p className="truncate text-xs text-[#a3a3a3]">
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#a3a3a3] hover:bg-[#f5f5f5] hover:text-[#525252] transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
