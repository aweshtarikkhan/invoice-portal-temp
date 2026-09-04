import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatformSocials, formatSocialUrl } from "@/hooks/use-platform-socials";
import { YoutubeIcon, FacebookIcon, InstagramIcon } from "@/components/shared/SocialMediaLinks";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Copy, Check, Share2, Sparkles, Send,
  FileText, Package, Landmark, Users, BarChart3,
  ExternalLink, Phone, Mail, Globe, Download,
  Layers, MessageSquare, Linkedin
} from "lucide-react";

export default function SocialLaunchPostsPage() {
  const navigate = useNavigate();
  const { socials } = usePlatformSocials();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: "Copied to Clipboard!",
      description: `${label} caption has been copied. You can now paste it directly into your social media app.`,
    });
    setTimeout(() => setCopiedKey(null), 3000);
  };

  const contactPhone = socials.contact_mobile || "+91 9876543210";
  const youtubeUrl = formatSocialUrl("youtube", socials.youtube);
  const facebookUrl = formatSocialUrl("facebook", socials.facebook);
  const instagramUrl = formatSocialUrl("instagram", socials.instagram);

  // Social Captions
  const captions = {
    instagram: `🚀 THE ALL-NEW ASSAYBIZ IS FINALLY HERE! 🇮🇳✨

Say goodbye to running your business across 5 different apps, confusing spreadsheets, and manual registers. 

Meet AssayBiz — India's Next-Gen Business Operating System built to automate your daily operations from day one:

⚡ 30-Second GST Invoicing with instant UPI QR payments
📦 Real-Time Multi-Warehouse Inventory & Barcode Tracking
💰 Seamless Banking, Automated Cash Flow & P&L
👥 Biometric Staff Attendance, Shifts & 1-Click Salary Slips
🤝 Built-in CRM for IndiaMART & Social Leads
📢 Branded Festival Poster Studio & WhatsApp Promotion

🔥 LAUNCH OFFER: Get 20% OFF on all Annual Plans + Free 1-on-1 Data Import & Setup! Use Code: LAUNCH20.

Plans start at ₹0 (Forever Free), ₹499/mo for Sales & Inventory, and ₹999/mo for the complete Business Suite!

📲 Click the link in bio to start your 14-day free trial or visit www.satahinvoice.com!
📞 Call us at ${contactPhone} for a live guided walkthrough.

#AssayBiz #GSTInvoicing #IndianBusiness #SMEGrowth #InventoryManagement #BusinessSoftware #MakeInIndia #StartupIndia #BusinessAutomation #SmartBilling`,

    facebook: `🎉 Big Announcement for Indian Business Owners & Entrepreneurs! 🇮🇳

We are thrilled to officially introduce the all-new AssayBiz — the complete Business Operating System designed to replace multiple expensive software subscriptions with one intuitive platform.

Whether you run a wholesale trading firm, manufacturing unit, retail store, or service business, AssayBiz provides:

✅ 100% GST-Ready Tax Invoicing & E-Way Bills
✅ Multi-Godown Stock Management with Low-Stock Alerts
✅ Live Cash Flow, Bank Reconciliation & Ledger Books
✅ Employee Selfie/GPS Punch Attendance & Payroll Management
✅ Lead Management CRM for quick sales conversions
✅ Ready-to-share Branded Festival Posters & WhatsApp Outreach

🎁 Special Launch Celebration:
Enjoy a FLAT 20% DISCOUNT on all annual subscriptions! Plus, our dedicated support team will help you migrate your existing Tally/Vyapar data for FREE!

👉 Start your free trial today: https://www.satahinvoice.com
📞 Direct Support Hotline: ${contactPhone}
Follow our official page for regular tutorials and growth tips!

#AssayBiz #BusinessProductivity #GSTIndia #AccountingSoftware #InventoryControl #MSMEIndia #BusinessSuite`,

    linkedin: `Thrilled to unveil AssayBiz: Reimagining Enterprise Operations for the Next 10 Million Indian MSMEs 🚀

Managing a growing enterprise in India often involves juggling fragmented systems — one software for GST billing, another for godown stock, biometric devices for staff payroll, and messy spreadsheets for cash flow.

AssayBiz bridges this gap with a unified, modular Business Operating System:
🔹 Financial Operations: Instant GST-compliant invoices, delivery challans, automated reconciliation, and audit-ready P&L reports.
🔹 Supply Chain: Multi-warehouse tracking, batch/expiry controls, and barcode scanners.
🔹 Human Capital: Geofenced selfie attendance, leave policies, and automated salary slip generation.
🔹 Revenue & Growth: Integrated CRM pipeline, IndiaMART lead capture, and bulk customer WhatsApp outreach.

Our modular pricing starts with a Forever Free plan, ₹499/mo for Sales & Inventory, up to ₹999/mo for the full Business Suite.

We're offering 20% off annual plans with complimentary onboarding for early adopters.

Explore the platform: https://www.satahinvoice.com
Reach our enterprise team at ${contactPhone} or support@assaybiz.com.

#Fintech #MSME #ERP #EnterpriseSoftware #GST #BusinessOperations #SaaS #ProductLaunch #IndianEnterprise`,

    whatsapp: `🌟 *ANNOUNCING THE ALL-NEW ASSAYBIZ!* 🇮🇳

Namaste! 🙏 We are excited to introduce *AssayBiz* — the all-in-one software to simplify and supercharge your business.

*Everything you need in ONE App:*
✅ *30-Sec GST Invoicing:* Tax invoices, quotations & instant UPI QR codes
✅ *Stock & Godown:* Live multi-warehouse inventory & low-stock alerts
✅ *Banking & Ledgers:* Cash flow reports, customer ledgers & expense tracking
✅ *Staff HR & Attendance:* Mobile selfie punch, leaves & payslips
✅ *WhatsApp & Promotion:* Branded festival greetings & customer broadcasts

🎁 *SPECIAL LAUNCH OFFER:*
Get *20% OFF* on Annual Plans + Free Data Migration!
Use Code: *LAUNCH20*

👉 *Try Free Demo Now:* https://www.satahinvoice.com
📞 *Call/WhatsApp for Setup:* ${contactPhone}

_Empowering 500+ Indian Businesses to Grow Faster._`,

    youtube: `🎉 WELCOME TO THE NEW ASSAYBIZ! Watch our official launch walkthrough and see how AssayBiz helps over 500+ Indian businesses automate their billing, stock, banking, HR, and marketing under one unified cloud platform!

📌 What's Covered in the New Release:
• 30-Second GST Invoicing with automatic UPI QR codes
• Multi-Warehouse Inventory with barcode scanner support
• Banking, Journal Entries, and Cash Flow reconciliation
• Employee Biometric & Selfie Attendance with salary slip export
• Integrated CRM and Branded Festival Marketing Studio

🎁 Launch Offer: Use promo code LAUNCH20 to get 20% OFF any annual plan + Free Data Migration from Tally/Vyapar!

🔗 Get Started for Free: https://www.satahinvoice.com
📞 Contact our team: ${contactPhone} | support@assaybiz.com

Make sure to subscribe to our channel for weekly software tutorials and business growth strategies!`
  };

  const shareViaWhatsapp = () => {
    const text = encodeURIComponent(captions.whatsapp);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/85 border-b border-slate-800 px-6 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />
            <div>
              <span className="font-bold text-white text-sm block">Social Media Launch Kit (6.6)</span>
              <span className="text-[11px] text-indigo-400 hidden sm:inline">Official launch creatives, multi-platform captions & broadcast copy</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={shareViaWhatsapp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> Share on WhatsApp
            </Button>
            <Button variant="outline" size="sm" asChild className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
              <Link to="/pamphlet">View Pamphlet</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-10">
        
        {/* Banner Announcement */}
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900 border border-indigo-700/50 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <Badge className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> OFFICIAL PRODUCT LAUNCH 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              AssayBiz Social Media Launch & Campaign Kit
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
              Use these pre-formatted promotional creatives and customized captions to launch and announce the updated AssayBiz brand, new modular packages, and pricing across your channels.
            </p>
          </div>
        </div>

        {/* Section 1: Visual Launch Creatives (4 Banners) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> 1. Visual Launch Creatives
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">High-contrast promotional creatives calibrated for Instagram, Facebook, and WhatsApp status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Creative 1 */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img src={logoImg} alt="AssayBiz" className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1" />
                    <div>
                      <span className="font-black text-white text-base leading-none block">AssayBiz</span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">Enterprise Business OS</span>
                    </div>
                  </div>
                  <Badge className="bg-indigo-600 text-white text-[10px] font-bold">Creative #1</Badge>
                </div>

                <div className="my-6">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-1">
                    NEXT-GEN BUSINESS MANAGEMENT
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                    Say Goodbye to 5 Disconnected Apps.
                  </h3>
                  <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                    GST Invoicing · Multi-Godown Stock · Staff Biometric HR · Cash Flow & Banking · Branded Promotions — all unified in AssayBiz.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="text-slate-400 text-[11px]">
                  <span>Trusted by <strong>500+ Businesses</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <span>100% GST Ready</span>
                </div>
              </div>
            </div>

            {/* Creative 2 */}
            <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border-2 border-purple-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img src={logoImg} alt="AssayBiz" className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1" />
                    <div>
                      <span className="font-black text-white text-base leading-none block">AssayBiz</span>
                      <span className="text-[10px] font-bold text-purple-400 uppercase">Pricing Reveal</span>
                    </div>
                  </div>
                  <Badge className="bg-purple-600 text-white text-[10px] font-bold">Creative #2</Badge>
                </div>

                <div className="my-6">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-300 block mb-1">
                    TRANSPARENT MODULAR PLANS
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                    Pay Only For What Your Business Needs.
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 block font-bold">Free Plan</span>
                      <span className="text-lg font-black text-white">₹0</span>
                    </div>
                    <div className="bg-slate-800/80 border border-indigo-500/50 rounded-lg p-2">
                      <span className="text-[10px] text-indigo-400 block font-bold">Sales & Stock</span>
                      <span className="text-lg font-black text-white">₹499<span className="text-[10px] text-slate-400">/mo</span></span>
                    </div>
                    <div className="bg-indigo-950/80 border border-indigo-500 rounded-lg p-2">
                      <span className="text-[10px] text-amber-400 block font-black">Business Suite</span>
                      <span className="text-lg font-black text-white">₹999<span className="text-[10px] text-slate-400">/mo</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Save 20% on Annual Plans</span>
                <span className="text-indigo-400 font-bold">Add-ons from ₹299/mo</span>
              </div>
            </div>

            {/* Creative 3 */}
            <div className="bg-gradient-to-br from-slate-900 via-amber-950/60 to-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img src={logoImg} alt="AssayBiz" className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1" />
                    <div>
                      <span className="font-black text-white text-base leading-none block">AssayBiz</span>
                      <span className="text-[10px] font-bold text-amber-400 uppercase">Special Launch Deal</span>
                    </div>
                  </div>
                  <Badge className="bg-amber-500 text-slate-950 text-[10px] font-black">Creative #3</Badge>
                </div>

                <div className="my-6">
                  <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full mb-2">
                    <Sparkles className="w-3 h-3 text-amber-400" /> LIMITED TIME OFFER
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                    Get Flat 20% OFF + Free 1-on-1 Setup & Data Migration!
                  </h3>
                  <div className="mt-4 bg-slate-800/90 border border-dashed border-amber-400/60 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Exclusive Coupon Code</span>
                      <span className="text-xl font-black text-amber-400 tracking-wider">LAUNCH20</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard("LAUNCH20", "code", "Coupon Code")}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs"
                    >
                      {copiedKey === "code" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 mr-1" />} Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Valid on all annual subscriptions</span>
                <span className="text-amber-400 font-bold">14-Day Free Trial</span>
              </div>
            </div>

            {/* Creative 4 */}
            <div className="bg-gradient-to-br from-slate-900 via-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <img src={logoImg} alt="AssayBiz" className="h-9 w-auto object-contain bg-white/95 rounded-lg p-1" />
                    <div>
                      <span className="font-black text-white text-base leading-none block">AssayBiz</span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Product Feature Spotlight</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Creative #4</Badge>
                </div>

                <div className="my-6">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-1">
                    ALL-IN-ONE POWER
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                    Everything Your Enterprise Needs to Scale Faster.
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
                    <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>30-Sec GST Billing</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg">
                      <Package className="w-4 h-4 text-blue-400" />
                      <span>Multi-Godown Stock</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg">
                      <Landmark className="w-4 h-4 text-emerald-400" />
                      <span>Banking & Cash Flow</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-lg">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span>Biometric Staff HR</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Mobile App + PC Browser</span>
                <span className="text-emerald-400 font-bold">Call {contactPhone}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Copy-Paste Multi-Platform Launch Captions */}
        <div className="pt-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" /> 2. Multi-Platform Launch Captions & Copy Kits
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">Click any platform tab below to preview and copy tailored launch copy with hashtags and emojis.</p>
          </div>

          <Tabs defaultValue="instagram" className="w-full">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 mb-6 flex flex-wrap h-auto gap-1">
              <TabsTrigger value="instagram" className="data-[state=active]:bg-pink-600 data-[state=active]:text-white flex items-center gap-1.5 text-xs font-semibold py-2 px-3">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-400 data-[state=active]:text-white" /> Instagram Post
              </TabsTrigger>
              <TabsTrigger value="facebook" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1.5 text-xs font-semibold py-2 px-3">
                <FacebookIcon className="w-3.5 h-3.5 text-blue-400 data-[state=active]:text-white" /> Facebook Post
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white flex items-center gap-1.5 text-xs font-semibold py-2 px-3">
                <Linkedin className="w-3.5 h-3.5 text-blue-400 data-[state=active]:text-white" /> LinkedIn Announcement
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-1.5 text-xs font-semibold py-2 px-3">
                <Share2 className="w-3.5 h-3.5 text-emerald-400 data-[state=active]:text-white" /> WhatsApp Broadcast
              </TabsTrigger>
              <TabsTrigger value="youtube" className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex items-center gap-1.5 text-xs font-semibold py-2 px-3">
                <YoutubeIcon className="w-3.5 h-3.5 text-red-400 data-[state=active]:text-white" /> YouTube Community
              </TabsTrigger>
            </TabsList>

            {/* Instagram Content */}
            <TabsContent value="instagram">
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-white">Instagram Feed & Reel Caption</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Optimized for high engagement, bio link call-to-action, and trending business hashtags.</CardDescription>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(captions.instagram, "instagram", "Instagram")}
                    className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold"
                  >
                    {copiedKey === "instagram" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copiedKey === "instagram" ? "Copied!" : "Copy Instagram Caption"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {captions.instagram}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Facebook Content */}
            <TabsContent value="facebook">
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-white">Facebook Page & Group Post</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Formatted for Indian MSME communities, business groups, and official page posts.</CardDescription>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(captions.facebook, "facebook", "Facebook")}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    {copiedKey === "facebook" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copiedKey === "facebook" ? "Copied!" : "Copy Facebook Caption"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {captions.facebook}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LinkedIn Content */}
            <TabsContent value="linkedin">
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-white">LinkedIn B2B Announcement</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Professional executive tone highlighting compliance, cash flow, and scalability.</CardDescription>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(captions.linkedin, "linkedin", "LinkedIn")}
                    className="bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
                  >
                    {copiedKey === "linkedin" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copiedKey === "linkedin" ? "Copied!" : "Copy LinkedIn Caption"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {captions.linkedin}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WhatsApp Content */}
            <TabsContent value="whatsapp">
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-white">WhatsApp Broadcast & Status Message</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Uses WhatsApp markdown (*bold*, bullets, emojis) for maximum readability and response.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={shareViaWhatsapp}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <Share2 className="w-4 h-4 mr-1.5" /> Send to WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(captions.whatsapp, "whatsapp", "WhatsApp")}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
                    >
                      {copiedKey === "whatsapp" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      {copiedKey === "whatsapp" ? "Copied!" : "Copy Text"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {captions.whatsapp}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* YouTube Content */}
            <TabsContent value="youtube">
              <Card className="bg-slate-900 border-slate-800 text-slate-100">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-base text-white">YouTube Community & Video Description</CardTitle>
                    <CardDescription className="text-xs text-slate-400">Engaging subscriber copy linking to feature walkthroughs and demo registration.</CardDescription>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(captions.youtube, "youtube", "YouTube")}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                  >
                    {copiedKey === "youtube" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                    {copiedKey === "youtube" ? "Copied!" : "Copy YouTube Caption"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {captions.youtube}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

      </main>
    </div>
  );
}
