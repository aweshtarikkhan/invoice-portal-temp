import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck, Check, Clock, Calendar, ShieldCheck,
  FileText, Smartphone, ArrowRight, Sparkles,
  Users, Award, Zap, Download, MessageSquare, ChevronRight,
  Calculator, CheckCircle2, ShieldAlert, Laptop
} from 'lucide-react';

const hrBadges = [
  { label: "GPS & Selfie Attendance" },
  { label: "Biometric Machine Sync" },
  { label: "1-Click Payroll & Payslips" },
  { label: "WhatsApp Slip Delivery" },
  { label: "Auto PF, ESIC & TDS Calc" },
  { label: "Multi-Shift & Leave Roster" },
];

const hrDeepFeatures = [
  {
    icon: Clock,
    title: "Smart Mobile Attendance",
    desc: "Empower field staff and office employees to punch in via mobile with geo-fence boundaries, or sync directly with your existing biometric hardware.",
    tag: "Zero Buddy Punching",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Calculator,
    title: "One-Click Automated Payroll",
    desc: "Never spend days on spreadsheets again. Assay Biz compiles working days, leaves, unpaid absences, overtime, and bonuses in seconds.",
    tag: "60-Sec Processing",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: MessageSquare,
    title: "Instant WhatsApp Payslips",
    desc: "Keep your team delighted. As soon as payroll is approved, employees receive a clean, branded PDF payslip directly on their WhatsApp numbers.",
    tag: "Zero Printing Cost",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: ShieldCheck,
    title: "Indian Statutory Compliance",
    desc: "Stay 100% compliant with EPF, ESI, Professional Tax (PT), and TDS deductions. Generate one-click monthly government filing summaries.",
    tag: "Audit Ready",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Calendar,
    title: "Leave & Shift Management",
    desc: "Configure flexible working shifts, rotating schedules, public holidays, and custom leave quotas (Casual, Sick, Earned/PL) with approval workflows.",
    tag: "Flexible Policies",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: Smartphone,
    title: "Dedicated Employee Self-Service",
    desc: "Staff can log in to their personal employee portal to view their attendance history, check leave balances, apply for time off, and download past payslips.",
    tag: "Self-Serve App",
    color: "from-cyan-500 to-blue-600",
  },
];

const hrSteps = [
  {
    num: "01",
    title: "Add Staff & Set Shifts",
    desc: "Import your team in bulk or one-by-one with salary structures, shifts, and leave rules.",
  },
  {
    num: "02",
    title: "Automatic Daily Tracking",
    desc: "Staff punches in via mobile GPS or biometric machine. Daily hours and overtime log automatically.",
  },
  {
    num: "03",
    title: "1-Click Pay & WhatsApp Slips",
    desc: "Review the month summary, click calculate, and deliver payslips straight to staff WhatsApp.",
  },
];

export default function HRFeaturesPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#28166f]/20 selection:text-[#28166f]">
      <PublicHeader />

      {/* Hero Section matching WhatsApp Invoice Highlight Style */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#180f3d] relative overflow-hidden text-white border-b border-white/10">
        {/* Glow elements */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#e77817]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-[450px] h-[450px] bg-[#28166f]/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 lg:gap-14 items-center relative z-10">
          {/* Left Column: Copy & Badges */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <div className="inline-flex items-center gap-2 mb-4 py-1.5 px-4 rounded-full bg-[#e77817]/20 border border-[#e77817]/40 text-[#ffaa47] text-xs sm:text-sm font-bold tracking-wide shadow-xs">
              <UserCheck className="h-4 w-4 text-[#ff9438]" />
              <span>ASSAY BIZ HR & PAYROLL</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.1rem] font-black tracking-tight text-white mb-4 leading-[1.18]">
              Track Attendance Instantly.{" "}
              <span className="bg-gradient-to-r from-[#ff9438] via-[#ffaa47] to-amber-300 bg-clip-text text-transparent">
                Run Payroll in 60 Seconds.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-[1.7] mb-8 font-normal max-w-2xl">
              Say goodbye to messy registers and manual Excel formulas. Seamlessly manage GPS & biometric attendance, leave approvals, statutory PF/ESI compliance, and 1-tap WhatsApp salary payslips.
            </p>

            {/* 6 Capability Badges matching Accounting WhatsApp section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 w-full mb-8">
              {hrBadges.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 hover:border-emerald-400/40 hover:bg-white/10 transition-all duration-200 group"
                >
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 grid place-items-center shrink-0 group-hover:scale-110 transition-transform">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="text-white font-semibold text-sm sm:text-[15px] leading-snug">{b.label}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                asChild
                className="bg-[#e77817] hover:bg-[#d56b10] text-white font-bold h-12 px-7 rounded-xl shadow-lg shadow-orange-500/25 text-base transition-all hover:scale-105"
              >
                <Link to="/register">
                  Start Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/15 text-white font-semibold h-12 px-6 rounded-xl text-base"
              >
                <a href="/#pricing">View Pricing & Plans</a>
              </Button>
            </div>
          </div>

          {/* Right Column: Realistic Mobile Mockup (HR Employee Portal + WhatsApp Payslip) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[300px]">
              {/* Outer Phone Shell */}
              <div className="rounded-[2.2rem] border-[8px] border-slate-900 bg-slate-900 overflow-hidden shadow-2xl shadow-black/70 relative aspect-[9/18.5]">
                {/* Speaker & Notch */}
                <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 z-30 flex items-center justify-center">
                  <div className="w-20 h-3 bg-slate-950 rounded-full flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-800" />
                    <div className="w-8 h-1 bg-slate-800 rounded-full" />
                  </div>
                </div>

                {/* WhatsApp Screen with Employee Attendance & Salary Slip */}
                <div className="absolute inset-0 bg-[#0f172a] text-slate-100 flex flex-col pt-5">
                  {/* Status Bar */}
                  <div className="bg-[#128C7E] px-3.5 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-black text-xs">
                        AB
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Assay Biz HR</div>
                        <div className="text-[9px] text-emerald-100 leading-tight">Employee Self-Service</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-full font-medium">Live</span>
                  </div>

                  {/* Body Chat Content */}
                  <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden text-[11px] bg-[#0b141a]">
                    <div className="flex justify-center">
                      <span className="bg-slate-800/80 text-slate-300 text-[9px] px-2.5 py-0.5 rounded-full border border-slate-700">
                        TODAY · 09:14 AM
                      </span>
                    </div>

                    {/* Check-In Confirmation Bubble */}
                    <div className="bg-[#1f2c34] rounded-2xl rounded-tl-xs p-3 border border-slate-700/50 shadow-md text-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-emerald-400 flex items-center gap-1 text-[11.5px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Punch In Verified
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">09:14:22</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mb-1">
                        📍 <strong>Main Office</strong> (Geo-Fence Match)
                      </div>
                      <div className="text-[9.5px] text-slate-400 flex justify-between pt-1 border-t border-slate-700/60 font-medium">
                        <span>Status: Present (On-Time)</span>
                        <span className="text-emerald-400 font-bold">+9.0 Hrs Shift</span>
                      </div>
                    </div>

                    {/* Attendance Summary Stat Card */}
                    <div className="bg-slate-900/90 rounded-xl p-2.5 border border-purple-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">This Month (Feb)</div>
                        <div className="text-xs font-bold text-white mt-0.5">24 Days Present</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Leaves Left</div>
                        <div className="text-xs font-bold text-[#ffaa47]">3 Casual · 2 Sick</div>
                      </div>
                    </div>

                    {/* WhatsApp Salary Slip Delivered Card */}
                    <div className="bg-[#005c4b] rounded-2xl rounded-tr-xs p-3 text-white shadow-md self-end w-full max-w-[95%]">
                      <div className="text-[9.5px] text-emerald-200 font-medium mb-1">
                        Salary credited for February 2026 🎉
                      </div>
                      <div className="bg-black/30 rounded-xl p-2.5 flex items-center gap-2.5 border border-emerald-400/20">
                        <div className="w-8 h-8 rounded-lg bg-red-500/90 flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate text-white">Payslip-Feb-2026.pdf</div>
                          <div className="text-[9px] text-emerald-200">Net Pay: ₹42,500 · 142 KB</div>
                        </div>
                      </div>
                      <button className="w-full mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1.5 shadow-sm">
                        <Download className="w-3 h-3" /> Download PDF Payslip
                      </button>
                    </div>
                  </div>

                  {/* Phone Bottom Home Bar */}
                  <div className="h-4 bg-[#0f172a] flex items-center justify-center pb-1">
                    <div className="w-24 h-1 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Floating Decorative Badges */}
              <div className="absolute -bottom-4 -left-6 bg-white text-slate-900 px-3.5 py-2 rounded-xl shadow-xl border border-slate-200 flex items-center gap-2 text-xs font-bold hidden sm:flex">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span>100% PF & ESIC Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Pillars Section */}
      <section className="py-20 bg-slate-50 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#28166f] bg-[#28166f]/10 border border-[#28166f]/20 px-4 py-1.5 rounded-full mb-3">
              COMPLETE WORKFORCE SUITE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Everything Needed to Manage 5 to 500+ Staff
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Assay Biz eliminates the chaos of attendance, shifts, leave approvals, and payroll so you can build a happier, more productive team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hrDeepFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + f.color + " flex items-center justify-center text-white shadow-md"}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {f.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#28166f]">
                    <span>Automated & Instant</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Simple Flow */}
      <section className="py-16 bg-white border-y border-slate-200/70">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Set Up in Under 10 Minutes
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              No complicated training or heavy software installations needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {hrSteps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-[#28166f] text-white flex items-center justify-center font-black text-lg mb-4 shadow-md shadow-[#28166f]/25">
                  {s.num}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Impact Stats */}
      <section className="py-14 bg-gradient-to-r from-[#211559] via-[#28166f] to-[#1c1248] text-white text-center">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#ffaa47] mb-1">15+ Hrs</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Saved on Payroll/Mo</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">100%</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Statutory Compliance</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-blue-400 mb-1">0</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Spreadsheet Formula Errors</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-1">Instant</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">WhatsApp Slip Delivery</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-slate-50 text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <Badge className="mb-4 py-1.5 px-4 bg-[#28166f]/10 text-[#28166f] border-0 rounded-full font-bold shadow-xs inline-flex">
            <Sparkles className="w-4 h-4 mr-2 text-[#e77817]" /> SMART HR AUTOMATION
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Ready to Modernize Your Staff & Payroll?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Join hundreds of growing Indian businesses using Assay Biz to track attendance, simplify leave management, and credit salaries accurately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="bg-[#e77817] hover:bg-[#d56b10] text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-orange-500/25 text-base hover:scale-105 transition-all"
            >
              <Link to="/register">
                Start Free Account <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-300 hover:bg-slate-100 font-bold h-12 px-7 rounded-xl text-base"
            >
              <a href="/#pricing">View Plans</a>
            </Button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
