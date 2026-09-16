import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import {
  Users, Check, Target, TrendingUp, ArrowRight,
  Calendar, Clock, PhoneCall, CheckCircle2, IndianRupee
} from 'lucide-react';

const badges = [
  "Multi-Source Lead Capture",
  "Visual Kanban Deal Stages",
  "WhatsApp Quick Follow-up",
  "1-Tap Quote to Invoice",
  "Call Logs & Reminders",
  "Client 360° History",
];

const pipeline = [
  { stage: "New Leads",    count: 12, color: "bg-blue-500",    leads: [
    { name: "Rajesh Ent.", val: "₹1.8L", hot: true },
    { name: "Sharma Traders", val: "₹75K", hot: false },
  ]},
  { stage: "In Discussion", count: 8, color: "bg-amber-500",  leads: [
    { name: "Patel & Sons", val: "₹3.2L", hot: true },
    { name: "Krishna Corp", val: "₹90K", hot: false },
  ]},
  { stage: "Quote Sent",  count: 5,  color: "bg-purple-500",  leads: [
    { name: "Mehta Bros", val: "₹2.1L", hot: false },
    { name: "Gupta Retail", val: "₹1.4L", hot: true },
  ]},
  { stage: "Won 🏆",       count: 3,  color: "bg-emerald-500", leads: [
    { name: "Singh Infra", val: "₹5.6L", hot: false },
    { name: "Jain Exports", val: "₹3.8L", hot: false },
  ]},
];

const upcoming = [
  { time: "10:30 AM", name: "Rajesh Enterprises", type: "Follow-up Call", tag: "High Priority", color: "border-red-400 bg-red-50" },
  { time: "12:00 PM", name: "Patel & Sons",        type: "Demo Presentation", tag: "Scheduled",   color: "border-blue-400 bg-blue-50" },
  { time: "03:00 PM", name: "Mehta Bros",           type: "Quotation Review", tag: "Pending",     color: "border-amber-400 bg-amber-50" },
];

export default function CRMFeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <PublicHeader />

      {/* ── SINGLE SCREEN HERO ── */}
      <main className="flex-1 flex items-center">
        <section className="w-full py-8 lg:py-0">
          <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[calc(100vh-72px)]">

            {/* LEFT: CRM Pipeline Illustration */}
            <div className="order-2 lg:order-1 flex items-center justify-center py-8 lg:py-0">
              <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

                {/* CRM Dashboard Header */}
                <div className="bg-[#e77817] px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-white font-black text-base tracking-tight">Sales Pipeline</div>
                    <div className="text-orange-100 text-xs mt-0.5">28 Active Deals · ₹24.8L in Pipeline</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/70 text-[10px] font-semibold">This Month</div>
                    <div className="text-white font-black text-base">₹9.4L Closed</div>
                  </div>
                </div>

                {/* Kanban Columns (compact horizontal) */}
                <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                  {pipeline.map((col, ci) => (
                    <div key={ci} className="flex flex-col">
                      <div className="px-2.5 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-700 leading-tight">{col.stage}</span>
                        <span className={"text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full " + col.color}>{col.count}</span>
                      </div>
                      <div className="p-1.5 flex flex-col gap-1.5 bg-slate-50 min-h-[100px]">
                        {col.leads.map((lead, li) => (
                          <div key={li} className={"bg-white rounded-lg px-2 py-1.5 shadow-sm border " + (lead.hot ? "border-orange-300" : "border-slate-100")}>
                            <div className="text-[9.5px] font-bold text-slate-800 leading-tight truncate">{lead.name}</div>
                            <div className="text-[9px] text-slate-500 font-semibold">{lead.val}</div>
                            {lead.hot && <div className="text-[8px] text-orange-500 font-bold mt-0.5">🔥 Hot</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Today's Meetings & Follow-ups */}
                <div className="p-4 bg-white">
                  <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">Today's Meetings & Follow-ups</div>
                  <div className="flex flex-col gap-2">
                    {upcoming.map((item, i) => (
                      <div key={i} className={"flex items-center gap-3 rounded-xl px-3 py-2 border-l-4 " + item.color}>
                        <div className="shrink-0 text-center">
                          <div className="text-[10px] font-black text-slate-700">{item.time}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                          <div className="text-[10px] text-slate-500">{item.type}</div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">{item.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-t border-slate-100">
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-sm font-black text-blue-600">28</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Active Leads</div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-sm font-black text-emerald-600">3x</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Faster Closing</div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-sm font-black text-[#e77817]">0%</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Missed Follow-ups</div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Copy */}
            <div className="order-1 lg:order-2 flex flex-col justify-center py-12 lg:py-0">
              <div className="inline-flex items-center gap-2 mb-5 py-1.5 px-4 rounded-full bg-[#e77817]/10 border border-[#e77817]/30 text-[#e77817] text-xs font-bold tracking-widest uppercase w-fit">
                <Target className="h-3.5 w-3.5" />
                CRM & SALES PIPELINE
              </div>

              <h1 className="text-3xl sm:text-4xl xl:text-[2.8rem] font-black tracking-tight text-slate-900 leading-[1.18] mb-4">
                Capture Every Lead.<br />
                <span className="bg-gradient-to-r from-[#28166f] to-[#e77817] bg-clip-text text-transparent">
                  Close Deals 3x Faster.
                </span>
              </h1>

              <p className="text-slate-600 text-base leading-relaxed mb-7 max-w-lg">
                From inquiry to invoice — manage your entire sales funnel with
                visual Kanban pipelines, automated WhatsApp follow-ups, and
                1-tap quotation-to-billing conversion.
              </p>

              {/* 6 Capability Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                {badges.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 hover:border-[#28166f]/40 hover:bg-[#28166f]/5 transition-all duration-200 group">
                    <div className="h-5 w-5 rounded-full bg-[#28166f]/15 border border-[#28166f]/30 text-[#28166f] flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-slate-800 font-semibold text-sm">{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#28166f] hover:bg-[#1e1055] text-white font-bold h-11 px-7 rounded-xl shadow-lg shadow-[#28166f]/25 text-sm hover:scale-105 transition-all">
                  <Link to="/register">Start Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-300 hover:bg-slate-100 font-bold h-11 px-6 rounded-xl text-sm text-slate-700">
                  <a href="/#pricing">View Plans</a>
                </Button>
              </div>
            </div>

          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
