import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone, Check, Sparkles, Image, Tag,
  MessageSquare, Send, ArrowRight, Share2,
  Gift, QrCode, BarChart3, Users, Zap, CheckCircle2
} from 'lucide-react';

const marketingBadges = [
  { label: "Bulk WhatsApp Broadcasts" },
  { label: "Auto Festive Poster Maker" },
  { label: "Business Logo & QR Branding" },
  { label: "Discount Coupons & Vouchers" },
  { label: "Inactive Client Retargeting" },
  { label: "Campaign Delivery Analytics" },
];

const marketingDeepFeatures = [
  {
    icon: Send,
    title: "1-Click WhatsApp Broadcast Studio",
    desc: "Broadcast new arrivals, price drops, and seasonal deals to thousands of customers simultaneously without getting banned, using approved templates.",
    tag: "98% Open Rate",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Image,
    title: "Instant Festive Poster Maker",
    desc: "Generate stunning festival greeting flyers (Diwali, Holi, Eid, New Year) pre-branded with your business logo, phone number, and address with 1 click.",
    tag: "Zero Designer Fees",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: Tag,
    title: "Smart Coupons & Promo Codes",
    desc: "Create percentage or flat discount coupon codes with minimum cart values and expiry dates. Customers can apply them during billing.",
    tag: "Drive Repeat Sales",
    color: "from-orange-500 to-amber-600",
  },
  {
    icon: Users,
    title: "Inactive Client Re-engagement",
    desc: "Assay Biz automatically detects clients who haven't ordered in the last 60 or 90 days, enabling you to trigger personalized 'We Miss You' deals.",
    tag: "Win Back Churn",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: QrCode,
    title: "Custom QR Code Posters",
    desc: "Download printable counter standees and posters embedded with your UPI payment QR code, store address, and Google Review links.",
    tag: "Print Ready",
    color: "from-rose-500 to-red-600",
  },
  {
    icon: BarChart3,
    title: "Live Campaign Insights",
    desc: "Know exactly which broadcasts drove orders. View detailed open rates, click-through rates, and revenue generated per campaign.",
    tag: "Real ROI Tracking",
    color: "from-cyan-500 to-blue-600",
  },
];

const marketingSteps = [
  {
    num: "01",
    title: "Choose Poster or Offer",
    desc: "Pick from hundreds of ready-to-use festival templates or configure a discount coupon.",
  },
  {
    num: "02",
    title: "Select Customer Audience",
    desc: "Send to all clients, top spenders, or customers with inactive purchase records.",
  },
  {
    num: "03",
    title: "Broadcast & Grow Revenue",
    desc: "Deliver personalized WhatsApp messages with your branded poster in one click.",
  },
];

export default function MarketingFeaturesPage() {
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
              <Megaphone className="h-4 w-4 text-[#ff9438]" />
              <span>ASSAY BIZ MARKETING & PROMOTION</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3.1rem] font-black tracking-tight text-white mb-4 leading-[1.18]">
              Reach 10,000+ Customers.{" "}
              <span className="bg-gradient-to-r from-[#ff9438] via-[#ffaa47] to-amber-300 bg-clip-text text-transparent">
                Boost Repeat Sales by 40%.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-[1.7] mb-8 font-normal max-w-2xl">
              Turn your existing customer database into an unstoppable revenue stream. Broadcast branded WhatsApp offers, auto-generate festive posters with your shop logo, and launch discount coupon campaigns with zero graphic design skills.
            </p>

            {/* 6 Capability Badges matching Accounting WhatsApp section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 w-full mb-8">
              {marketingBadges.map((b, i) => (
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

          {/* Right Column: Realistic Mobile Mockup (WhatsApp Marketing Poster Broadcast) */}
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

                {/* WhatsApp Broadcast Screen */}
                <div className="absolute inset-0 bg-[#0f172a] text-slate-100 flex flex-col pt-5">
                  {/* Status Bar */}
                  <div className="bg-[#128C7E] px-3.5 py-2 flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center font-black text-xs">
                        AM
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Assay Promotion</div>
                        <div className="text-[9px] text-emerald-100 leading-tight">Broadcast to 1,250 Clients</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-700/60 px-2 py-0.5 rounded-full font-medium">Delivered</span>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden text-[11px] bg-[#0b141a]">
                    <div className="flex justify-center">
                      <span className="bg-slate-800/80 text-slate-300 text-[9px] px-2.5 py-0.5 rounded-full border border-slate-700">
                        FESTIVE BROADCAST
                      </span>
                    </div>

                    {/* Festive Graphic Creative Card */}
                    <div className="bg-[#005c4b] rounded-2xl rounded-tr-xs p-2.5 text-white shadow-md self-end w-full">
                      {/* Branded Poster Mockup Graphic */}
                      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-amber-500 via-rose-500 to-purple-700 p-3 text-center relative border border-white/20 shadow-inner">
                        <div className="text-[9px] font-black uppercase tracking-widest text-amber-200">
                          Assay Biz Store · Festive Sale
                        </div>
                        <div className="text-base font-black text-white mt-1 leading-tight">
                          FLAT 25% OFF 💥
                        </div>
                        <div className="text-[9px] text-white/90 mt-0.5">
                          On All Stock & Wholesale Orders
                        </div>
                        <div className="mt-2 inline-block bg-white text-slate-900 font-bold px-2 py-0.5 rounded-md text-[9px] shadow-sm">
                          CODE: FESTIVE25
                        </div>
                      </div>

                      {/* WhatsApp text description */}
                      <div className="text-[10px] text-emerald-100 mt-2 leading-relaxed">
                        Namaste! Hamare sabhi loyal customers ke liye special festive offer. Order karein aur payein 25% discount! 🛍️
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-emerald-400/20 text-[8.5px] text-emerald-200">
                        <span>Valid till: 31st March</span>
                        <span className="font-bold text-white">Delivered ✅✅</span>
                      </div>
                    </div>

                    {/* Customer Responses */}
                    <div className="bg-white rounded-xl rounded-tl-xs p-2 shadow-sm text-slate-900 self-start max-w-[90%]">
                      <div className="text-[10px] font-semibold text-slate-800">
                        Offer code apply karke 5 cartons order kar diye hain! Invoice share kar dena 🙏
                      </div>
                      <div className="text-[8px] text-slate-400 mt-0.5 text-right">Just now</div>
                    </div>

                    {/* Performance Stat Metric */}
                    <div className="bg-slate-900/90 rounded-xl p-2 border border-emerald-500/30 flex items-center justify-between text-[9.5px]">
                      <span className="text-slate-400">Campaign Orders:</span>
                      <span className="text-emerald-400 font-bold">₹1,42,800 Generated</span>
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
                <span>98% WhatsApp Open Rate</span>
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
              ALL-IN-ONE PROMOTION STUDIO
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Marketing Made Effortless for Indian SMBs
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              No need to hire expensive marketing agencies or graphic designers. Assay Biz gives you readymade tools to attract, delight, and retain clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {marketingDeepFeatures.map((f, i) => {
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
                    <span>High-ROI Campaign Tools</span>
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
              Launch High-Impact Campaigns in 3 Minutes
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Pick a template, select your audience, and send directly to customer WhatsApp chats.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {marketingSteps.map((s, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#28166f] to-indigo-700 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md shadow-indigo-500/25">
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
            <div className="text-3xl sm:text-4xl font-black text-[#ffaa47] mb-1">40%+</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Repeat Order Growth</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">98%</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">WhatsApp Message Open Rate</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-blue-400 mb-1">100+</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Festive Poster Templates</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-1">0</div>
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Graphic Design Experience Needed</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-slate-50 text-center relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <Badge className="mb-4 py-1.5 px-4 bg-rose-100 text-rose-600 border-0 rounded-full font-bold shadow-xs inline-flex">
            <Sparkles className="w-4 h-4 mr-2 text-[#e77817]" /> SKYROCKET YOUR SALES
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Ready to Turn Contacts into High-Paying Orders?
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Start reaching your customers on India's favorite communication channel with Assay Marketing Studio.
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
