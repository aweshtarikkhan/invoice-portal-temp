import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import {
  Megaphone, Check, Send, Image, Tag,
  ArrowRight, Users, BarChart3, Star
} from 'lucide-react';

const badges = [
  "Bulk WhatsApp Broadcasts",
  "Auto Festive Poster Maker",
  "Logo & QR Branded Creatives",
  "Printable Brochure & Pamphlet Maker",
  "Inactive Client Retargeting",
  "Multi-Channel WhatsApp & Email Campaigns",
];

const campaigns = [
  { name: "Diwali Sale 2026",   sent: 1250, opened: 1156, orders: 87, revenue: "₹1,42,800", status: "Live",     badge: "bg-emerald-500" },
  { name: "Flash Weekend Offer", sent: 840,  opened: 772,  orders: 54, revenue: "₹68,400",  status: "Completed",badge: "bg-blue-500" },
  { name: "New Arrivals Aug",    sent: 620,  opened: 544,  orders: 38, revenue: "₹41,200",  status: "Completed",badge: "bg-slate-500" },
];

const posterColors = [
  "from-rose-500 via-orange-500 to-amber-400",
  "from-purple-600 via-blue-500 to-cyan-400",
  "from-emerald-500 via-teal-500 to-blue-500",
];

const posterTitles = ["Diwali Offer 🪔", "New Stock In! 📦", "Year End Sale 🎉"];
const posterDisc   = ["FLAT 30% OFF", "Exclusive Deals", "Upto 50% OFF"];

export default function MarketingFeaturesPage() {
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
                <Megaphone className="h-3.5 w-3.5" />
                MARKETING & PROMOTION
              </div>

              <h1 className="text-[1.35rem] sm:text-3xl md:text-[1.85rem] lg:text-[2.15rem] xl:text-[2.45rem] font-black tracking-tight text-white leading-[2.2] mb-5">
                <span className="whitespace-nowrap inline-block">Reach 10,000+ Customers.</span>
                <br />
                <span className="whitespace-nowrap inline-block bg-gradient-to-r from-[#ff9438] to-amber-300 bg-clip-text text-transparent">
                  Boost Repeat Sales by 40%.
                </span>
              </h1>

              <p className="text-slate-300 text-base leading-relaxed mb-7 max-w-lg">
                Turn your customer list into a revenue machine. Create branded
                WhatsApp campaigns, auto-generate festive posters with your logo,
                and launch promotional campaigns — no designer needed.
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

            {/* RIGHT: Marketing Studio UI Illustration */}
            <div className="flex items-center justify-center py-8 lg:py-0">
              <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/30">

                {/* Studio Header */}
                <div className="bg-gradient-to-r from-[#28166f] to-[#e77817] px-5 py-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-white font-black text-base tracking-tight">Promotion Studio</div>
                    <div className="text-white/70 text-xs mt-0.5">1,250 customers · Last sent 2 hrs ago</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Active
                  </div>
                </div>

                {/* Poster Previews Row */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Festive Poster Templates</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {posterColors.map((grad, i) => (
                      <div key={i} className={"rounded-xl overflow-hidden bg-gradient-to-br " + grad + " p-3 text-center relative cursor-pointer hover:scale-105 transition-transform shadow-md"}>
                        <div className="text-[9px] font-black uppercase text-white/80 tracking-wider">Aassay Biz Store</div>
                        <div className="text-sm font-black text-white mt-0.5 leading-tight">{posterTitles[i]}</div>
                        <div className="text-[10px] font-black text-white/90 mt-1 bg-black/20 rounded px-1.5 py-0.5">{posterDisc[i]}</div>
                        {i === 0 && (
                          <div className="absolute top-1 right-1 bg-white/20 border border-white/40 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">Live</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Performance Table */}
                <div className="px-4 pt-3 pb-2 bg-white">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Recent Campaigns</div>
                  <div className="flex flex-col gap-1.5">
                    {campaigns.map((c, i) => (
                      <div key={i} className="grid grid-cols-5 items-center gap-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-[10px]">
                        <div className="col-span-2 min-w-0">
                          <div className="font-bold text-slate-800 truncate">{c.name}</div>
                          <div className="text-slate-400 truncate">{c.sent} sent</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-slate-700">{Math.round(c.opened / c.sent * 100)}%</div>
                          <div className="text-slate-400">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-emerald-600">{c.revenue}</div>
                          <div className="text-slate-400">Revenue</div>
                        </div>
                        <div className="flex justify-end">
                          <span className={"text-white text-[8px] font-bold px-2 py-0.5 rounded-full " + c.badge}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-t border-slate-100">
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-sm font-black text-emerald-600">98%</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Open Rate</div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-sm font-black text-[#e77817]">40%+</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Repeat Orders</div>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <div className="text-sm font-black text-[#28166f]">100+</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Poster Templates</div>
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
