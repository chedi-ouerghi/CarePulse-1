import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarePulse - Diabetes Digital Twin",
  description: "AI-powered diabetes management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <nav className="border-b border-gray-200 bg-white">
              <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
                    CP
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    CarePulse
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="/onboarding"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Onboarding
                  </a>
                  <a
                    href="/dashboard"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/alerts"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Alerts
                  </a>
                </div>
              </div>
            </nav>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
