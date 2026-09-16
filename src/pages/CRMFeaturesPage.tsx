import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, Check, Target, TrendingUp, PhoneCall,
  FileText, MessageSquare, ArrowRight, Sparkles,
  Zap, Calendar, BarChart3, Clock, CheckCircle2,
  Award, Shield, Smartphone
} from 'lucide-react';

const crmBadges = [
  { label: "Multi-Source Lead Capture" },
  { label: "Visual Kanban Deal Stages" },
  { label: "WhatsApp Quick Follow-up" },
  { label: "1-Tap Quotation to Invoice" },
  { label: "Call Logs & Reminder Alerts" },
  { label: "Client 360° Activity History" },
];

const crmDeepFeatures = [
  {
    icon: Target,
    title: "Omnichannel Lead Ingestion",
    desc: "Capture every hot lead automatically from your website, WhatsApp, IndiaMART, Facebook ads, and incoming phone calls into one clean dashboard.",
    tag: "Never Lose a Lead",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: TrendingUp,
    title: "Visual Kanban Deal Pipelines",
    desc: "Drag-and-drop deals across customized stages: In Discussion, Quotation Sent, Negotiation, Won, or Lost. Spot bottlenecks instantly.",
    tag: "Visual Clarity",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp 1-Tap Conversations",
    desc: "Reach out to leads instantly using pre-configured WhatsApp chat templates. Share brochures, pricing sheets, and product photos in seconds.",
    tag: "10x Fast Follow-up",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: FileText,
    title: "Instant Estimate to GST Invoice",
    desc: "Generate professional estimates directly inside the deal record. Once approved by the client, convert it to a GST invoice with 1 click.",
    tag: "Zero Manual Re-Entry",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: Clock,
    title: "Smart Follow-up Reminders",
    desc: "Set automatic follow-up tasks, meeting schedules, and call logs. Get real-time alerts so no sales conversation goes cold.",
    tag: "Zero Dropped Leads",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: BarChart3,
    title: "Sales Rep & Revenue Analytics",
    desc: "Track sales performance, lead conversion ratios, average deal size, and individual team member revenue generation in real-time.",
    tag: "Data Driven",
    color: "from-indigo-500 to-blue-600",
  },
];

const crmSteps = [
  {
    num: "01",
    title: "Capture Inquiries",
    desc: "Leads automatically land in your CRM from web forms, WhatsApp inquiries, and calls.",
  },
  {
    num: "02",
    title: "Fast Follow-up & Quote",
    desc: "Send personalized WhatsApp proposals, log call notes, and schedule next steps.",
  },
  {
    num: "03",
    title: "Close & Convert to Bill",
    desc: "Move deal to 'WON' and convert the quote into a compliant GST invoice instantly.",
  },
];

export default function CRMFeaturesPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[#e77817]/20 selection:text-[#e77817]">
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
              <Users className="h-4 w-4 text-[#ff9438]" />
              <span>ASSAY BIZ CRM & PIPELINE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.1rem] font-black tracking-tight text-white mb-4 leading-[1.18]">
              Capture Every Lead.{" "}
              <span className="bg-gradient-to-r from-[#ff9438] via-[#ffaa47] to-amber-300 bg-clip-text text-transparent">
                Close Deals 3x Faster.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-[1.7] mb-8 font-normal max-w-2xl">
              Turn scattered inquiries into loyal paying customers. Manage your entire sales pipeline with visual Kanban stages, automated WhatsApp follow-ups, and one-click quotation-to-invoice billing.
            </p>

            {/* 6 Capability Badges matching Accounting WhatsApp section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 w-full mb-8">
              {crmBadges.map((b, i) => (
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

          {/* Right Column: Realistic Mobile Mockup (CRM Deal Pipeline & WhatsApp Quote) */}
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

                {/* CRM Live WhatsApp Screen */}
                <div className="absolute inset-0 bg-[#0f172a] text-slate-100 flex flex-col pt-5">
                  {/* Status Bar */}
                  <div className="bg-[#128C7E] px-3.5 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-black text-xs">
                        AC
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Assay Biz CRM</div>
                        <div className="text-[9px] text-emerald-100 leading-tight">Hot Lead Alert · Online</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-full font-medium">Auto-Bot</span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden text-[11px] bg-[#0b141a]">
                    <div className="flex justify-center">
                      <span className="bg-slate-800/80 text-slate-300 text-[9px] px-2.5 py-0.5 rounded-full border border-slate-700">
                        NEW INQUIRY · JUST NOW
                      </span>
                    </div>

                    {/* New Lead Incoming Card */}
                    <div className="bg-[#1f2c34] rounded-2xl rounded-tl-xs p-3 border border-slate-700/50 shadow-md text-slate-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-[#ffaa47] flex items-center gap-1 text-[11px]">
                          <Target className="w-3.5 h-3.5" /> New High-Value Lead
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded">High Priority</span>
                      </div>
                      <div className="text-xs font-bold text-white mb-0.5">
                        Rajesh Enterprises
                      </div>
                      <div className="text-[10px] text-slate-300 mb-2">
                        Requirement: Commercial Solar Setup · ₹3,80,000
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-700/60 text-[9px]">
                        <span className="text-slate-400">Stage: In Discussion</span>
                        <span className="text-right text-emerald-400 font-bold">1-Tap WhatsApp 💬</span>
                      </div>
                    </div>

                    {/* WhatsApp Quotation Shared Bubble */}
                    <div className="bg-[#005c4b] rounded-2xl rounded-tr-xs p-3 text-white shadow-md self-end w-full max-w-[95%]">
                      <div className="text-[9.5px] text-emerald-200 font-medium mb-1">
                        Quotation shared via WhatsApp ⚡
                      </div>
                      <div className="bg-black/30 rounded-xl p-2 flex items-center gap-2.5 border border-emerald-400/20">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/90 flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-[11px] truncate text-white">EST-2026-089.pdf</div>
                          <div className="text-[9px] text-emerald-200">₹3,80,000 + GST · 1-Tap Pay</div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Reply */}
                    <div className="bg-white rounded-xl rounded-tl-xs p-2.5 shadow-sm text-slate-900 self-start max-w-[90%]">
                      <div className="text-[10px] font-semibold text-slate-800">
                        Quotation approved! Advance payment transfer kar diya hai 👍
                      </div>
                      <div className="text-[8px] text-slate-400 mt-1 text-right">10:45 AM</div>
                    </div>

                    {/* Stage Updated to Won Banner */}
                    <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 border border-emerald-500/40 rounded-xl p-2 text-center text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Deal WON 🏆 · Converted to Invoice #INV-089
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
                <div className="w-3 h-3 rounded-full bg-[#e77817] animate-pulse" />
                <span>3x Faster Lead Conversions</span>
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
              POWERFUL SALES ENGINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Turn Inquiries Into Lifetime Paying Clients
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Designed specifically for Indian business workflows. Manage deals, automate WhatsApp follow-ups, and ensure no customer slips through the cracks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {crmDeepFeatures.map((f, i) => {
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

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#e77817]">
                    <span>High Conversion Pipeline</span>
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
              Accelerate Your Sales in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Go from messy sticky notes to an automated high-converting sales machine.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {crmSteps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-[#e77817] text-white flex items-center justify-center font-black text-lg mb-4 shadow-md shadow-[#e77817]/25">
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
            <div className="text-3xl sm:text-4xl font-black text-[#ffaa47] mb-1">3x</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Faster Deal Closure</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">0%</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Missed Follow-ups</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-blue-400 mb-1">1-Tap</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Estimate to GST Bill</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-1">360°</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Customer Purchase History</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-slate-50 text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <Badge className="mb-4 py-1.5 px-4 bg-orange-100 text-[#e77817] border-0 rounded-full font-bold shadow-xs inline-flex">
            <Sparkles className="w-4 h-4 mr-2 text-[#e77817]" /> AUTOMATE YOUR SALES
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Ready to Supercharge Your Sales Pipeline?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Empower your sales team with smart CRM tools, instant WhatsApp connectivity, and complete billing integration.
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
