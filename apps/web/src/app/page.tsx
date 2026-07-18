"use client";

import { useAuth } from "@/components/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import {
  Activity,
  BrainCircuit,
  Shield,
  Users,
  ArrowRight,
  Menu,
  X,
  BarChart3,
  Bell,
  MessageCircle,
  Zap,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

function useIsAuthenticated() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

function Header() {
  const { user, isLoading } = useIsAuthenticated();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#e2e8f0]/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
            <Image src="/logo.jpg" alt="CarePulse" width={36} height={36} className="object-contain" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-[#0f172a]">CarePulse</span>
            <p className="text-[10px] font-medium text-[#94a3b8] tracking-wide uppercase -mt-0.5">Digital Twin Platform</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">How It Works</a>
          <a href="#about" className="text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors">About</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!isLoading && user ? (
            <button
              onClick={() => router.push(user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95"
            >
              Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/signin")}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-95"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748b] hover:bg-[#f1f5f9] md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#e2e8f0] bg-white px-6 py-4 md:hidden animate-slideDown">
          <div className="flex flex-col gap-3">
            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#64748b] py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#64748b] py-2">How It Works</a>
            <a href="#about" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#64748b] py-2">About</a>
            <hr className="border-[#e2e8f0]" />
            {!isLoading && user ? (
              <button
                onClick={() => { router.push(user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard"); setMobileOpen(false); }}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-medium text-white"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button onClick={() => { router.push("/signin"); setMobileOpen(false); }} className="w-full rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-medium text-[#64748b]">Sign In</button>
                <button onClick={() => { router.push("/signup"); setMobileOpen(false); }} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-2.5 text-sm font-medium text-white">Get Started</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f8fafc]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-100/40 to-cyan-100/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-blue-50/50 to-cyan-50/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-[300px] w-[300px] rounded-full bg-gradient-to-r from-blue-500/5 to-cyan-500/5 blur-2xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5NGEzYjgiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-32 pb-24 text-center">
        <div className="animate-fadeIn">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-6 shadow-sm">
            <Zap className="mr-1.5 h-3 w-3" />
            AI-Powered Diabetes Management
          </span>
        </div>

        <h1 className="animate-fadeIn stagger-1 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0f172a] leading-[1.1]">
          Your{" "}
          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Digital Twin
          </span>
          <br />
          for Diabetes Care
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-[#64748b] leading-relaxed animate-fadeIn stagger-2">
          CarePulse creates a real-time digital twin of your metabolic health.
          AI-powered insights, predictive risk detection, and seamless
          clinician collaboration — all in one platform.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn stagger-3">
          <button
            onClick={() => router.push("/signup")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.97]"
          >
            Start Free <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push("/signin")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-7 py-3.5 text-base font-semibold text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a] hover:border-[#cbd5e1] transition-all duration-200 active:scale-[0.97]"
          >
            Sign In <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fadeIn stagger-4">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/70 backdrop-blur-sm p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#0f172a]">10k+</p>
            <p className="text-sm text-[#64748b] mt-1">Active Patients</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/70 backdrop-blur-sm p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#0f172a]">99.5%</p>
            <p className="text-sm text-[#64748b] mt-1">Prediction Accuracy</p>
          </div>
          <div className="rounded-2xl border border-[#e2e8f0] bg-white/70 backdrop-blur-sm p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#0f172a]">&lt;3min</p>
            <p className="text-sm text-[#64748b] mt-1">Report Generation</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: "AI Digital Twin",
      desc: "A real-time virtual replica of your metabolic health, continuously updated from glucose readings, lifestyle data, and clinical history.",
      gradient: "from-blue-600 to-cyan-600",
      shadow: "shadow-blue-500/10",
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: "Real-Time Monitoring",
      desc: "Continuous glucose tracking with smart alerts for hypo/hyperglycemic events. Live dashboard with trend visualization and anomaly detection.",
      gradient: "from-emerald-500 to-green-500",
      shadow: "shadow-emerald-500/10",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Predictive Risk Scoring",
      desc: "ML-driven risk assessment for hypoglycemia, hyperglycemia, medication adherence, and lifestyle impact. Early warnings before complications arise.",
      gradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/10",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Clinical Reports",
      desc: "Automated pre-visit summaries with key findings, risk scores, and treatment recommendations — generated in under 3 minutes.",
      gradient: "from-blue-600 to-cyan-600",
      shadow: "shadow-blue-500/10",
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "AI Health Assistant",
      desc: "Conversational AI trained on your personal health data. Ask questions about patterns, get tips, and understand your diabetes better.",
      gradient: "from-emerald-500 to-green-500",
      shadow: "shadow-emerald-500/10",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Care Coordination",
      desc: "Seamless data sharing between patients and clinicians. Real-time alerts, shared dashboards, and collaborative care planning.",
      gradient: "from-orange-500 to-amber-500",
      shadow: "shadow-orange-500/10",
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16 animate-fadeIn">
          <p className="text-xs font-semibold text-blue-600 tracking-widest uppercase">Platform Features</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a]">
            Everything you need to manage diabetes
          </h2>
          <p className="mt-4 text-[#64748b] leading-relaxed">
            From real-time monitoring to AI-powered insights, CarePulse provides
            a complete ecosystem for patients and clinicians.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#cbd5e1] hover:-translate-y-0.5 animate-slideUp"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-lg ${f.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-[#0f172a]">{f.title}</h3>
              <p className="mt-2 text-sm text-[#64748b] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { step: "01", title: "Connect Your Data", desc: "Upload glucose readings via CSV, connect a CGM device, or log manually. CarePulse ingests and normalizes all data streams in real time." },
    { step: "02", title: "AI Builds Your Twin", desc: "Our AI agents analyze patterns, detect anomalies, and construct a personalized digital twin — a virtual model of your metabolic health." },
    { step: "03", title: "Get Insights & Alerts", desc: "Receive predictive risk scores, hypo/hyper alerts, and personalized recommendations. Share reports with your care team instantly." },
  ];

  return (
    <section id="how-it-works" className="relative py-24 bg-[#f8fafc]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-gradient-to-bl from-blue-50/60 to-transparent blur-2xl" />
        <div className="absolute bottom-20 left-0 w-[250px] h-[250px] rounded-full bg-gradient-to-tr from-cyan-50/60 to-transparent blur-2xl" />
      </div>
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center mb-16 animate-fadeIn">
          <p className="text-xs font-semibold text-blue-600 tracking-widest uppercase">How It Works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-[#0f172a]">
            From data to actionable insights in minutes
          </h2>
        </div>

        <div className="space-y-8">
          {steps.map((s, i) => (
            <div key={s.step} className="group relative flex items-start gap-6 animate-slideUp" style={{ animationDelay: `${i * 80}ms` }}>
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-14 bottom-0 w-px bg-gradient-to-b from-blue-200 to-transparent" />
              )}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                {s.step}
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-lg font-semibold text-[#0f172a] group-hover:text-blue-600 transition-colors">{s.title}</h3>
                <p className="mt-2 text-sm text-[#64748b] leading-relaxed max-w-2xl">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const router = useRouter();

  return (
    <section className="relative py-24 bg-gradient-to-br from-blue-600 to-cyan-700 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-white/5 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Ready to transform diabetes care?
        </h2>
        <p className="mt-4 text-lg text-blue-100/80">
          Join thousands of patients and clinicians using CarePulse to manage
          diabetes with the power of AI.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/signup")}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.97]"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push("/signin")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all duration-200 active:scale-[0.97]"
          >
            Sign In <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="about" className="border-t border-[#e2e8f0] bg-white py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
              <Image src="/logo.jpg" alt="CarePulse" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <span className="text-base font-bold text-[#0f172a]">CarePulse</span>
              <p className="text-xs text-[#94a3b8]">AI-Powered Digital Twin Platform</p>
            </div>
          </div>
          <p className="text-sm text-[#94a3b8]">
            &copy; {new Date().getFullYear()} CarePulse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const redirectPath = user.role === "clinician" ? "/clinician/dashboard" : "/patient/dashboard";
      router.push(redirectPath);
    }
  }, [user, isLoading, router]);

  if (!isLoading && user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg">
            <Image src="/logo.jpg" alt="CarePulse" width={40} height={40} className="object-contain opacity-0 absolute" />
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-[#64748b]">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
