import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import {
  UserCheck, Check, Clock, Calendar, ShieldCheck,
  ArrowRight, Fingerprint, MapPin, IndianRupee, FileText
} from 'lucide-react';

const badges = [
  "GPS & Selfie Attendance",
  "Biometric Machine Sync",
  "1-Click Payroll & Payslips",
  "WhatsApp Slip Delivery",
  "Auto PF / ESIC / TDS",
  "Multi-Shift & Leave Roster",
];

const employees = [
  { name: "Rahul Sharma",     role: "Store Manager",  status: "P",  time: "09:02", color: "bg-emerald-500" },
  { name: "Priya Verma",      role: "Sales Executive", status: "P",  time: "09:14", color: "bg-emerald-500" },
  { name: "Deepak Singh",     role: "Delivery Staff",  status: "A",  time: "—",     color: "bg-red-400" },
  { name: "Ankita Patel",     role: "Accountant",      status: "HD", time: "10:30", color: "bg-amber-400" },
  { name: "Ravi Kumar",       role: "Warehouse Staff", status: "P",  time: "08:55", color: "bg-emerald-500" },
];

const months = ["M","T","W","T","F","S","S"];

export default function HRFeaturesPage() {
  const days = Array.from({ length: 28 }, (_, i) => {
    const s = ["P","P","P","A","P","P","HD","P","P","P","P","A","P","P","P","P","P","P","HD","P","P","A","P","P","P","P","P","P"];
    return s[i] || "P";
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0b2e] font-sans">
      <PublicHeader />

      {/* ── SINGLE SCREEN HERO ── */}
      <main className="flex-1 flex items-center">
        <section className="w-full py-8 lg:py-0">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100vh-72px)]">

            {/* LEFT: Copy */}
            <div className="flex flex-col justify-center py-12 lg:py-0">
              <div className="inline-flex items-center gap-2 mb-5 py-1.5 px-4 rounded-full bg-[#e77817]/20 border border-[#e77817]/40 text-[#ffaa47] text-xs font-bold tracking-widest uppercase w-fit">
                <UserCheck className="h-3.5 w-3.5" />
                HR & PAYROLL AUTOMATION
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-[2.8rem] font-black tracking-tight text-white leading-[1.18] mb-4">
                Track Attendance.<br />
                <span className="bg-gradient-to-r from-[#ff9438] to-amber-300 bg-clip-text text-transparent">
                  Run Payroll in 60 Seconds.
                </span>
              </h1>

              <p className="text-slate-300 text-base leading-relaxed mb-7 max-w-lg">
                Ditch the Excel sheets. Manage GPS attendance, biometric punch-in,
                leave approvals, PF/ESI compliance, and WhatsApp payslip delivery
                — all in one place.
              </p>

              {/* 6 Capability Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                {badges.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:border-emerald-400/40 hover:bg-white/10 transition-all duration-200 group">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-white font-semibold text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#e77817] hover:bg-[#d56b10] text-white font-bold h-11 px-7 rounded-xl shadow-lg shadow-orange-500/25 text-sm hover:scale-105 transition-all">
                  <Link to="/register">Start Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-white/5 hover:bg-white/15 text-white font-semibold h-11 px-6 rounded-xl text-sm">
                  <a href="/#pricing">View Plans</a>
                </Button>
              </div>
            </div>

            {/* RIGHT: Attendance Portal UI Illustration */}
            <div className="flex items-center justify-center py-8 lg:py-0">
              <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/30">

                {/* Portal Header */}
                <div className="bg-[#28166f] px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-black text-base tracking-tight">Mark Your Attendance</div>
                    <div className="text-blue-200 text-xs mt-0.5">Today · Tuesday, 16 Sep 2026</div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Tracking
                  </div>
                </div>

                {/* Employee Punch-in Status Table */}
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">
                    <span>Employee</span>
                    <span className="text-center">Status</span>
                    <span className="text-center">In Time</span>
                    <span className="text-right">Method</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {employees.map((emp, i) => (
                      <div key={i} className="grid grid-cols-4 items-center bg-white rounded-lg px-3 py-2.5 shadow-sm border border-slate-100">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{emp.role}</div>
                        </div>
                        <div className="flex justify-center">
                          <span className={"text-[10px] font-black text-white px-2 py-0.5 rounded-md " + emp.color}>
                            {emp.status}
                          </span>
                        </div>
                        <div className="text-center text-xs font-mono text-slate-600 font-semibold">{emp.time}</div>
                        <div className="flex justify-end">
                          {emp.status !== "A" ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <Fingerprint className="w-3 h-3 text-[#28166f]" /> GPS
                            </div>
                          ) : (
                            <span className="text-[10px] text-red-400 font-semibold">Absent</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Attendance Calendar Strip */}
                <div className="px-4 py-3 bg-white border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">February Attendance</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Present</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Absent</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Half</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {months.map((d, i) => (
                      <div key={i} className="text-center text-[9px] font-bold text-slate-400">{d}</div>
                    ))}
                    {days.map((d, i) => (
                      <div
                        key={i}
                        title={d === "P" ? "Present" : d === "A" ? "Absent" : "Half Day"}
                        className={"h-5 w-full rounded text-[9px] font-bold flex items-center justify-center text-white " +
                          (d === "P" ? "bg-emerald-500" : d === "A" ? "bg-red-400" : "bg-amber-400")}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Stats Bar */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 bg-white">
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-black text-emerald-600">24</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Present Days</div>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-black text-[#28166f]">₹42,500</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Net Salary</div>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <div className="text-lg font-black text-[#e77817]">3</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Leaves Left</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
