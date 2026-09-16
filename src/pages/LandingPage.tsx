import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Check, X, Zap, Shield, Smartphone, FileText, IndianRupee,
  MessageCircle, Star, ArrowRight, Sparkles, BarChart3, Package,
  Globe, PlayCircle, ShieldCheck, Building2, Quote, Timer, Users, Layers,
  Calculator, UserCheck, Megaphone, BrainCircuit, Link2,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroDashboardMockup } from "@/components/public/HeroDashboardMockup";
import { BookDemoDialog } from "@/components/public/BookDemoDialog";
import { SocialMediaLinks } from "@/components/shared/SocialMediaLinks";
import { usePlatformSocials, formatSocialUrl } from "@/hooks/use-platform-socials";

type Lang = "en" | "hi";

const t = {
  en: {
    nav_features: "Features", nav_pricing: "Pricing", nav_compare: "Compare", nav_login: "Sign in",
    hero_eyebrow: "Built for Indian SMBs · 100% GST Ready",
    hero_title: "Send GST invoices in 30 seconds.",
    hero_sub: "Assay Biz is the fastest GST-compliant billing software for shopkeepers, freelancers and growing businesses. Create, share and get paid — all in one place.",
    cta_primary: "Create your first invoice — Free",
    cta_secondary: "Watch 60-sec demo",
    trust_users: "100+ businesses trust Assay Biz",
    trust_invoices: "₹23 Cr+ invoiced",
    trust_rating: "4.8 / 5 on Assay",
    trust_uptime: "99.99% uptime",
    speed_claim: "Invoice ready in 60 seconds",
    no_card_badge: "No credit card needed",
    badges_title: "Built for India. Verified for GST.",
    feat_title: "Everything you need to run your business",
    feat_sub: "Invoicing, inventory, GST returns, payments — no spreadsheets required.",
    wa_eyebrow: "Instant Sharing",
    wa_title: "Send invoices instantly. Get paid 2x faster.",
    wa_sub: "One tap to share a polished PDF with a UPI QR. Your customers pay instantly — no app downloads, no logins.",
    wa_bullets: ["1-tap share with PDF + UPI QR", "Auto payment reminders for overdue invoices", "Customer portal — pay without sign-up"],
    cmp_title: "Why teams switch to Assay Biz",
    cmp_sub: "Honest comparison with the tools you're probably using today.",
    test_title: "our business made more then 12,000 invoices",
    pricing_title: "Simple pricing. No surprises.",
    pricing_sub: "Start free forever. Upgrade only when you grow.",
    pricing_cta_free: "Start Free",
  },
  hi: {
    nav_features: "फीचर्स", nav_pricing: "प्राइसिंग", nav_compare: "तुलना", nav_login: "साइन इन",
    hero_eyebrow: "भारतीय व्यापारियों के लिए · 100% GST रेडी",
    hero_title: "30 सेकंड में GST बिल भेजें।",
    hero_sub: "Assay Biz भारत का सबसे तेज़ GST बिलिंग सॉफ़्टवेयर है — दुकानदार, फ्रीलांसर और बढ़ते बिज़नेस के लिए। बिल बनाओ, भेजो, पेमेंट लो — एक ही जगह।",
    cta_primary: "अभी मुफ़्त बिल बनाएं",
    cta_secondary: "60-सेकंड डेमो देखें",
    trust_users: "100+ बिज़नेस Assay Biz पर भरोसा करते हैं",
    trust_invoices: "₹23 करोड़+ की बिलिंग",
    trust_rating: "4.8 / 5 Assay पर",
    trust_uptime: "99.99% अपटाइम",
    speed_claim: "60 सेकंड में इनवॉइस तैयार",
    no_card_badge: "कोई क्रेडिट कार्ड नहीं चाहिए",
    badges_title: "भारत के लिए बना। GST के लिए वेरिफ़ाइड।",
    feat_title: "आपके बिज़नेस के लिए सब कुछ — एक ही जगह",
    feat_sub: "बिलिंग, स्टॉक, GST रिटर्न, पेमेंट — कोई एक्सेल नहीं चाहिए।",
    wa_eyebrow: "इंस्टेंट शेयर",
    wa_title: "बिल भेजें। 2x तेज़ पेमेंट पाएं।",
    wa_sub: "एक टैप में PDF + UPI QR के साथ बिल भेजें। कस्टमर तुरंत पेमेंट करें — कोई ऐप या लॉगिन नहीं।",
    wa_bullets: ["1-टैप शेयर — PDF + UPI QR के साथ", "ओवरड्यू बिल के लिए ऑटो रिमाइंडर", "कस्टमर पोर्टल — बिना साइन-अप पेमेंट"],
    cmp_title: "लोग Assay Biz क्यों चुनते हैं",
    cmp_sub: "जो टूल्स आप आज इस्तेमाल कर रहे हैं उनसे ईमानदार तुलना।",
    test_title: "our business made more then 12,000 invoices",
    pricing_title: "सीधी प्राइसिंग। कोई छुपा शुल्क नहीं।",
    pricing_sub: "हमेशा के लिए मुफ़्त शुरू करें। बढ़ने पर ही अपग्रेड करें।",
    pricing_cta_free: "मुफ़्त शुरू करें",
  },
};

const complianceBadges = [
  { icon: ShieldCheck, label: "GST Ready" },
  { icon: FileText, label: "GSTIN Supported" },
  { icon: Shield, label: "E-invoice (IRP) Compatible" },
  { icon: IndianRupee, label: "UPI / QR Payments" },
  { icon: BarChart3, label: "GSTR-1 & 3B Export" },
  { icon: Building2, label: "Tally CSV Export" },
];

const growthFeatures = [
  {
    icon: FileText,
    title: "Invoicing",
    desc: "Create, send and track invoices easily.",
    cardBg: "bg-blue-50/50 border-blue-100 hover:border-[#28166f]/40",
    iconBg: "bg-blue-100/80 text-[#28166f]",
  },
  {
    icon: Calculator,
    title: "Accounting",
    desc: "Manage your finances with confidence.",
    cardBg: "bg-emerald-50/40 border-emerald-100 hover:border-emerald-400",
    iconBg: "bg-emerald-100/80 text-emerald-600",
  },
  {
    icon: Users,
    title: "CRM",
    desc: "Build stronger customer relationships.",
    cardBg: "bg-orange-50/50 border-orange-100 hover:border-[#e77817]/40",
    iconBg: "bg-[#e77817]/15 text-[#e77817]",
  },
  {
    icon: UserCheck,
    title: "HRMS",
    desc: "Manage your team, attendance and payroll with ease.",
    cardBg: "bg-purple-50/40 border-purple-100 hover:border-purple-400",
    iconBg: "bg-purple-100/80 text-purple-600",
  },
  {
    icon: Megaphone,
    title: "Promotion",
    desc: "Grow your brand with built-in marketing tools.",
    cardBg: "bg-rose-50/40 border-rose-100 hover:border-rose-400",
    iconBg: "bg-rose-100/80 text-rose-500",
  },
  {
    icon: Star,
    title: "Business Feedback",
    desc: "Listen, analyze and improve with customer feedback.",
    cardBg: "bg-amber-50/40 border-amber-100 hover:border-amber-400",
    iconBg: "bg-amber-100/80 text-amber-500",
  },
  {
    icon: BrainCircuit,
    title: "AI Analysis",
    desc: "Get smart insights and predictions with AI.",
    cardBg: "bg-cyan-50/40 border-cyan-100 hover:border-cyan-400",
    iconBg: "bg-cyan-100/80 text-cyan-600",
  },
  {
    icon: Link2,
    title: "Integrations",
    desc: "Connect with Email, WhatsApp and other tools seamlessly.",
    cardBg: "bg-emerald-50/40 border-emerald-100 hover:border-emerald-400",
    iconBg: "bg-emerald-100/80 text-emerald-600",
  },
];

const features = [
  { icon: Zap, title: "30-second invoicing", desc: "Pre-filled GST rates, HSN lookup, auto-numbering. Done before your chai gets cold." },
  { icon: MessageCircle, title: "Share + UPI QR", desc: "Send a polished PDF with a UPI QR. Customers pay in one tap." },
  { icon: Package, title: "Inventory with stock ledger", desc: "Auto-deduct stock on sales, restock on credit notes. Negative-stock warnings." },
  { icon: FileText, title: "GSTR-1, GSTR-3B, HSN summary", desc: "Generate filing-ready JSON and CSV. Tally export included." },
  { icon: BarChart3, title: "P&L, receivables, aging", desc: "Know who owes you, what's overdue, and what you actually earned." },
  { icon: Smartphone, title: "Works offline, installs as app", desc: "PWA — install on phone or laptop. Use it even on a weak network." },
];



export default function LandingPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("satah-lang") as Lang) || "en");
  const [allowFreePlan, setAllowFreePlan] = useState(true);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [customReviews, setCustomReviews] = useState<any[] | null>(null);
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);
  const { socials } = usePlatformSocials();
  const L = t[lang];

  useEffect(() => {
    localStorage.setItem("satah-lang", lang);
  }, [lang]);

  useEffect(() => {
    if (!loading && session) navigate("/dashboard", { replace: true });
  }, [session, loading, navigate]);

  useEffect(() => {
    // Fetch global settings
    supabase.from("platform_settings").select("*").in("key", ["allow_free_plan", "landing_page_reviews"]).then(({ data }) => {
      if (data) {
        const freePlan = data.find(d => d.key === "allow_free_plan");
        if (freePlan && freePlan.value === "false") setAllowFreePlan(false);

        const reviews = data.find(d => d.key === "landing_page_reviews");
        if (reviews && reviews.value) {
          try {
            const parsed = JSON.parse(reviews.value);
            if (Array.isArray(parsed) && parsed.length > 0) setCustomReviews(parsed);
          } catch (e) {
            console.error("Failed to parse landing page reviews", e);
          }
        }
      }
    });
    
    // Fetch active plans
    supabase.from("plans").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      if (data) setDbPlans(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/30 selection:text-navy">
      {/* Nav */}
      <PublicHeader />

      {/* Modern SaaS Hero Section matching user screenshot */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fafc] via-[#f5f7fb] to-white pt-12 pb-20 lg:pt-18 lg:pb-28 border-b border-slate-200/70">
        {/* Subtle gradient background orbs matching logo colors */}
        <div className="absolute top-0 right-1/4 -translate-y-12 w-[600px] h-[600px] bg-[#28166f]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 w-[500px] h-[500px] bg-[#e77817]/10 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-6 relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="lg:col-span-6 text-left flex flex-col justify-center items-start">
            
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-[#28166f] text-xs font-bold uppercase tracking-wider mb-5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#e77817] shrink-0" />
              <span>AUTOMATE YOUR BUSINESS. ONE SMART PLATFORM.</span>
            </div>

            {/* Main Headline: Fluid dynamic responsive font sizing by screen size, exactly 2 lines with balanced line gap */}
            <h1 className="flex flex-col gap-1 sm:gap-1.5 text-3xl sm:text-4xl md:text-[44px] lg:text-[42px] xl:text-[50px] 2xl:text-[56px] font-black tracking-tight leading-[1.22] text-slate-900 mb-6">
              <span className="block sm:whitespace-nowrap">
                Simplify Your{" "}
                <span className="bg-gradient-to-r from-[#28166f] via-[#7b2cbf] to-[#e77817] bg-clip-text text-transparent">
                  Business
                </span>
              </span>
              <span className="block sm:whitespace-nowrap">
                Amplify Your{" "}
                <span className="bg-gradient-to-r from-[#28166f] via-[#7b2cbf] to-[#e77817] bg-clip-text text-transparent">
                  Growth
                </span>
              </span>
            </h1>

            {/* Subtitle description */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-8 max-w-xl font-normal">
              Invoicing, Accounting, CRM, HRMS, Marketing, Feedback, Ai Analysis and more — everything your business needs, in one powerful platform.
            </p>

            {/* Enlarged Prominent CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 mb-8 w-full sm:w-auto">
              <Button
                size="lg"
                className="h-14 sm:h-15 px-8 sm:px-9 text-base sm:text-lg font-black bg-[#28166f] hover:bg-[#e77817] text-white shadow-xl shadow-[#28166f]/25 hover:shadow-[#e77817]/35 rounded-2xl w-full sm:w-auto transition-all duration-300 hover:scale-[1.03] cursor-pointer"
                asChild
              >
                <a href="#pricing">
                  Get Started Free <ArrowRight className="ml-2.5 h-5 w-5 stroke-[2.5]" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 sm:h-15 px-8 sm:px-9 text-base sm:text-lg font-black bg-white hover:bg-orange-50/80 text-[#28166f] hover:text-[#e77817] border-2 border-slate-300 hover:border-[#e77817] rounded-2xl w-full sm:w-auto shadow-sm cursor-pointer transition-all duration-300 hover:scale-[1.03] group"
                onClick={() => setIsDemoDialogOpen(true)}
              >
                Book a Demo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" /> Easy Setup
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" /> Trusted by Growing Businesses
              </span>
            </div>

          </div>

          {/* Right Column: Interactive SaaS Software Dashboard Mockup */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end w-full mt-4 lg:mt-0 overflow-hidden sm:overflow-visible px-1 sm:px-0">
            <HeroDashboardMockup />
          </div>

        </div>
      </section>

      {/* Stats/Trust strip */}
      <section className="bg-white border-b py-10 relative -mt-8 z-20 mx-4 sm:mx-8 lg:mx-auto max-w-6xl rounded-2xl shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-0 px-6 text-center md:divide-x divide-slate-100">
          {[
            { v: "100+", l: L.trust_users, c: "text-primary" },
            { v: "₹23 Cr+", l: L.trust_invoices, c: "text-emerald-500" },
            { v: "4.8 ★", l: L.trust_rating, c: "text-amber-500" },
            { v: "99.99%", l: L.trust_uptime, c: "text-blue-500" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col items-center justify-center">
              <div className={`text-3xl sm:text-4xl font-black tracking-tight mb-2 ${s.c}`}>{s.v}</div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features - Everything You Need to Grow */}
      <section id="features" className="py-24 bg-slate-50/40 border-y border-slate-100 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#28166f]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#e77817]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#28166f] bg-[#28166f]/10 border border-[#28166f]/20 px-4 py-1.5 rounded-full mb-4">
              POWERFUL FEATURES
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Everything You Need to Grow
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Assaybiz brings all essential business tools together, so you can save time, reduce complexity and focus on what matters most — your growth.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {growthFeatures.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className={`p-4 sm:p-5 rounded-2xl border ${f.cardBg} transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex items-center gap-4 group cursor-default`}
                >
                  <div className={`w-12 h-12 rounded-full ${f.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-2xs`}>
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 mb-0.5 group-hover:text-[#28166f] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 leading-snug">
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance badges - Built for India. Verified for GST. */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
            {L.badges_title}
          </p>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {complianceBadges.map(b => (
              <div
                key={b.label}
                className="group flex items-center gap-2.5 px-5 py-3.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:bg-[#e77817] hover:border-[#e77817] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
              >
                <b.icon className="h-5 w-5 text-[#e77817] group-hover:text-white transition-colors shrink-0" />
                <span className="font-semibold text-slate-700 group-hover:text-white transition-colors">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp highlight */}
      <section className="py-16 bg-navy relative overflow-hidden text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#e77817]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-5 py-1.5 px-4 rounded-full bg-[#e77817]/20 border border-[#e77817]/40 text-[#ffaa47] text-xs font-bold tracking-wide shadow-xs">
              <MessageCircle className="h-4 w-4 text-[#ff9438]" />
              <span>{L.wa_eyebrow}</span>
            </div>
            <h2 className="text-3xl md:text-[2.6rem] font-black tracking-tight text-white !text-white mb-5 leading-tight">
              {lang === "hi" ? (
                <>
                  बिल भेजें।{" "}
                  <span className="text-[#ff9438]">2x तेज़ पेमेंट पाएं।</span>
                </>
              ) : (
                <>
                  Send invoices instantly.{" "}
                  <span className="text-[#ff9438]">Get paid 2x faster.</span>
                </>
              )}
            </h2>
            <p className="text-base text-slate-200 leading-relaxed mb-6 font-normal">{L.wa_sub}</p>
            <ul className="space-y-4">
              {L.wa_bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 grid place-items-center shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="text-white font-medium text-sm leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real WhatsApp-style mobile mockup */}
          <div className="relative mx-auto w-full max-w-[280px]">
            <div className="rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 overflow-hidden shadow-2xl shadow-black/60 relative" style={{aspectRatio: '9/19'}}>
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 z-30 flex items-end justify-center pb-1">
                <div className="w-20 h-3 bg-slate-900 rounded-b-xl"></div>
              </div>
              {/* WhatsApp wallpaper bg */}
              <div className="absolute inset-0 bg-[#e5ddd5]">
                <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Ccircle cx='40' cy='40' r='30' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E\")", backgroundSize: '40px'}}></div>
              </div>

              <div className="absolute inset-0 flex flex-col">
                {/* Status bar */}
                <div className="bg-[#128C7E] pt-5 pb-0 z-20">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                      <span className="text-white font-black text-xs">A</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-xs">Assay</div>
                      <div className="text-[10px] text-white/80">online</div>
                    </div>
                    <div className="flex gap-2 text-white/80">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </div>
                  </div>
                </div>

                {/* Chat area — scrollable */}
                <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col justify-end gap-1.5">
                  {/* Date badge */}
                  <div className="flex justify-center mb-1">
                    <span className="bg-white/70 text-slate-500 text-[8px] px-2 py-0.5 rounded-full">TODAY</span>
                  </div>

                  {/* Incoming: greeting */}
                  <div className="flex items-end gap-1 max-w-[82%]">
                    <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-2 py-1.5 text-[10px] text-slate-800 relative">
                      Hi! Mera invoice ready hai kya? 🙏
                      <span className="text-[8px] text-slate-400 ml-1 float-right mt-0.5">10:30</span>
                    </div>
                  </div>

                  {/* Outgoing: yes sharing now */}
                  <div className="flex justify-end">
                    <div className="bg-[#dcf8c6] rounded-xl rounded-tr-none shadow-sm px-2 py-1.5 text-[10px] text-slate-800 max-w-[82%]">
                      Ji bilkul! Abhi bhejta hoon 👇
                      <div className="flex justify-end items-center gap-0.5 mt-0.5">
                        <span className="text-[8px] text-slate-400">10:31</span>
                        <svg className="h-2.5 w-2.5 text-blue-500" viewBox="0 0 16 11" fill="currentColor"><path d="M11.071.653a.75.75 0 010 1.06L4.5 8.284 1.449 5.233a.75.75 0 00-1.06 1.06l3.64 3.641a.75.75 0 001.06 0l7.102-7.22a.75.75 0 000-1.061.75.75 0 00-1.12 0z"/><path d="M15.071.653a.75.75 0 010 1.06L8.5 8.284l-.53-.53 6.04-6.041a.75.75 0 011.06-.06z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Outgoing: PDF invoice card */}
                  <div className="flex justify-end">
                    <div className="bg-[#dcf8c6] rounded-xl rounded-tr-none shadow-sm text-[10px] max-w-[88%] overflow-hidden">
                      <div className="bg-white/60 px-2 py-1.5 flex items-center gap-1.5">
                        <div className="bg-red-500 p-1 rounded shrink-0"><FileText className="h-3 w-3 text-white" /></div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-700 text-[9px] truncate">INV-2026-0184.pdf</div>
                          <div className="text-[8px] text-slate-400">2 Pages · 245 KB</div>
                        </div>
                      </div>
                      <div className="px-2 py-1.5">
                        <div className="font-black text-slate-800 text-xs">₹24,750</div>
                        <div className="bg-[#25D366] text-white text-[9px] font-bold text-center py-0.5 rounded mt-1">Pay via UPI ➜</div>
                      </div>
                      <div className="flex justify-end px-2 pb-1">
                        <span className="text-[8px] text-slate-400">10:31</span>
                      </div>
                    </div>
                  </div>

                  {/* Incoming: payment done */}
                  <div className="flex items-end gap-1 max-w-[82%]">
                    <div className="bg-white rounded-xl rounded-tl-none shadow-sm px-2 py-1.5 text-[10px] text-slate-800">
                      Payment kar diya! Thanks ✅
                      <span className="text-[8px] text-slate-400 ml-1 float-right mt-0.5">10:42</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp input bar */}
                <div className="bg-[#f0f0f0] flex items-center gap-1.5 px-2 py-1.5 z-20">
                  <div className="flex-1 bg-white rounded-full px-3 py-1 text-[9px] text-slate-400 flex items-center">
                    Type a message
                  </div>
                  <div className="h-6 w-6 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Pricing */}
      <section id="pricing" className="pt-24 pb-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-20">
            <Badge className="mb-6 gap-2 py-1.5 px-4 bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-full font-bold shadow-sm inline-flex">
              <Zap className="h-4 w-4" /> Choose Your Plans
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy mb-6">{L.pricing_title}</h2>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">
              Select one or more plans for your business. Mix and match exactly what you need.
            </p>
          </div>

          {(() => {
            const allPlans = dbPlans.filter(p => p.name !== "free" || allowFreePlan);

            const planIcons: Record<string, { icon: string; color: string; bg: string; desc: string }> = {
              free: { icon: "🆓", color: "text-slate-600", bg: "bg-slate-100", desc: "Basic invoicing features for small businesses at no cost." },
              accounting: { icon: "📦", color: "text-blue-600", bg: "bg-blue-100", desc: "Full billing, sales, purchases & inventory management." },
              hr: { icon: "👥", color: "text-indigo-600", bg: "bg-indigo-100", desc: "Complete HR solution — attendance, payroll, leaves & shifts." },
              crm: { icon: "🎯", color: "text-emerald-600", bg: "bg-emerald-100", desc: "Manage leads, deals, sales pipeline and customer relationships." },
              promotion: { icon: "📢", color: "text-rose-600", bg: "bg-rose-100", desc: "Festival posters, WhatsApp & broadcast marketing campaigns." },
              suite: { icon: "🏢", color: "text-primary", bg: "bg-primary/10", desc: "Complete all-in-one business suite with full system access!" },
            };

            const togglePlan = (planName: string) => {
              setSelectedPlans(prev => 
                prev.includes(planName) ? prev.filter(n => n !== planName) : [...prev, planName]
              );
            };

            const hasSuite = selectedPlans.includes("suite");
            const finalSelected = new Set(selectedPlans);

            let totalMonthly = 0;
            finalSelected.forEach(name => {
              const plan = allPlans.find((p) => p.name === name);
              if (!plan) return;
              totalMonthly += plan.price_monthly;
            });

            return (
              <>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 ${finalSelected.size > 0 ? "mb-12" : "mb-0"}`}>
                  {allPlans.map((p) => {
                    const meta = planIcons[p.name] || { icon: "✨", color: "text-primary", bg: "bg-primary/10", desc: "" };
                    const isIncludedFree = hasSuite && p.name !== "suite" && p.name !== "free";
                    const isSelected = finalSelected.has(p.name);
                    const isPopular = p.name === "suite";
                    
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => !isIncludedFree && togglePlan(p.name)}
                        className={`relative flex flex-col bg-white rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer ${isSelected ? "border-2 border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/5 scale-105 z-10" : isIncludedFree ? "border-2 border-emerald-500/50 bg-emerald-50/30 opacity-90" : "border border-slate-200 hover:border-primary/40 hover:shadow-lg"}`}
                      >
                        {isPopular && (
                          <div className="bg-primary text-white text-xs font-bold uppercase tracking-wider text-center py-1.5 shadow-sm">
                            Most Popular Choice
                          </div>
                        )}
                        {isIncludedFree && (
                          <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                            Included in Suite
                          </div>
                        )}
                        
                        <div className="p-8 flex-1 flex flex-col">
                          <div className="flex items-start gap-4 mb-6">
                            <div className={`mt-1 h-6 w-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"}`}>
                              {isSelected && <Check className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`h-12 w-12 rounded-2xl ${meta.bg} flex items-center justify-center text-2xl shadow-sm`}>
                                  {meta.icon}
                                </div>
                                <h3 className="font-extrabold text-2xl text-navy">{p.display_name}</h3>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-slate-500 mb-8 min-h-[48px]">{meta.desc}</p>
                          
                          <div className="mb-8">
                            {isIncludedFree ? (
                              <div className="text-3xl font-black text-emerald-500">Free</div>
                            ) : (
                              <div className="flex items-end gap-1">
                                <span className="text-4xl font-black text-navy">{'₹'}{(p.price_monthly / 100).toLocaleString()}</span>
                                <span className="text-slate-500 font-medium mb-1">/month</span>
                              </div>
                            )}
                            {!isIncludedFree && p.price_monthly > 0 && (
                              <div className="text-sm font-semibold text-emerald-600 mt-2 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">
                                Save {Math.round((1 - p.price_yearly / (p.price_monthly * 12)) * 100)}% yearly
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
                            {Array.isArray(p.features) && p.features.map((f, i) => (
                              <div key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                                <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                                <span>{f}</span>
                              </div>
                            ))}
                            {p.employee_limit && (
                              <div className="flex gap-3 text-sm font-medium text-slate-600">
                                <Users className="h-5 w-5 text-emerald-500 shrink-0" />
                                <span>Up to {p.employee_limit} employees</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floating Checkout Bar */}
                {finalSelected.size > 0 && (
                  <div className="sticky bottom-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 mx-4 md:mx-auto max-w-4xl">
                    <div className="bg-navy/95 backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-full shadow-2xl shadow-navy/50 p-4 md:p-3 md:pl-8 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 w-full">
                      <div className="flex items-center gap-6">
                        <div className="bg-white/10 h-12 w-12 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{finalSelected.size}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-300 uppercase tracking-wider">Total Selected</div>
                          <div className="text-3xl font-black text-white">{'₹'}{(totalMonthly / 100).toLocaleString('en-IN')}<span className="text-lg font-medium text-slate-400">/mo</span></div>
                        </div>
                      </div>
                      <Button size="lg" className="w-full md:w-auto h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_20px_rgba(249,115,22,0.4)]" asChild>
                        <Link to={`/register?plan=${Array.from(finalSelected).join(",")}`}>
                          Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />

      {/* Book a Demo Modal */}
      <BookDemoDialog open={isDemoDialogOpen} onOpenChange={setIsDemoDialogOpen} />
    </div>
  );
}
