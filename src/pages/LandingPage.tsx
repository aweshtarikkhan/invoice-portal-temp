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
  Gift, Crown, Bell, Target, MessageSquare, Clock,
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { HeroDashboardMockup } from "@/components/public/HeroDashboardMockup";
import { BookDemoDialog } from "@/components/public/BookDemoDialog";
import { SocialMediaLinks } from "@/components/shared/SocialMediaLinks";
import { usePlatformSocials, formatSocialUrl } from "@/hooks/use-platform-socials";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
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

      {/* Merged Banner & Stats/Trust Section */}
      <section className="relative -mt-10 sm:-mt-12 z-20 mx-4 sm:mx-8 lg:mx-auto max-w-6xl">
        <div className="rounded-3xl bg-gradient-to-r from-[#211559] via-[#28166f] to-[#1c1248] border border-white/15 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-80 h-80 bg-[#e77817]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top CTA Row */}
          <div className="p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e77817]/20 border border-[#e77817]/40 text-[#ffaa47] text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#ff9438]" />
                <span>EXPERIENCE ASSAY BIZ TODAY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Ready to streamline your business operations?
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Join 100+ growing Indian businesses. Invoicing, accounting, inventory, and staff management — all in one place.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3.5 shrink-0 w-full sm:w-auto">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#e77817] hover:bg-[#ff8a24] text-white font-bold text-sm shadow-lg shadow-[#e77817]/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <span>Start Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="/#pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 backdrop-blur-sm transition-all duration-300"
              >
                View Pricing & Plans
              </a>
            </div>
          </div>

          {/* Integrated Stats Row */}
          <div className="border-t border-white/10 bg-black/25 backdrop-blur-xs py-7 px-6 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-y-0 text-center md:divide-x divide-white/10">
              {[
                { v: "100+", l: L.trust_users, c: "text-[#ffaa47]" },
                { v: "₹23 Cr+", l: L.trust_invoices, c: "text-emerald-400" },
                { v: "4.8 ★", l: L.trust_rating, c: "text-amber-400" },
                { v: "99.99%", l: L.trust_uptime, c: "text-blue-400" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center justify-center px-2">
                  <div className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-1 ${s.c}`}>{s.v}</div>
                  <div className="text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
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
      <section id="pricing" className="pt-24 pb-24 bg-[#fafbfc] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 gap-2 py-1.5 px-4 bg-primary/10 text-primary hover:bg-primary/20 border-0 rounded-full font-bold shadow-xs inline-flex">
              <Zap className="h-4 w-4" /> CHOOSE YOUR PLANS
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">{L.pricing_title}</h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto">
              Select one or more plans for your business. Mix and match exactly what you need.
            </p>
          </div>

          {(() => {
            const togglePlan = (planName: string) => {
              setSelectedPlans(prev => 
                prev.includes(planName) ? prev.filter(n => n !== planName) : [...prev, planName]
              );
            };

            const isSuiteSelected = selectedPlans.includes("suite");
            const finalSelected = new Set(selectedPlans);

            // Calculate total based on fixed UI plan prices
            let totalMonthly = 0;
            if (finalSelected.has("suite")) {
              totalMonthly = 1499;
            } else {
              if (finalSelected.has("accounting")) totalMonthly += 599;
              if (finalSelected.has("hr")) totalMonthly += 599;
              if (finalSelected.has("crm")) totalMonthly += 349;
              if (finalSelected.has("promotion")) totalMonthly += 349;
            }

            return (
              <>
                {/* 1. TOP BANNER: Free Plan */}
                {allowFreePlan && (
                  <div
                    onClick={() => togglePlan("free")}
                    className={`mb-6 rounded-2xl bg-white border p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-xs ${
                      selectedPlans.includes("free")
                        ? "border-[#e77817] ring-2 ring-[#e77817]/20 shadow-md"
                        : "border-orange-200/90 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left: Icon & Description */}
                      <div className="flex items-start gap-4 lg:w-[32%]">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-[#e77817] flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/25">
                          <Gift className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Free Plan</h3>
                            {selectedPlans.includes("free") && (
                              <span className="text-xs font-bold text-[#e77817] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">Selected</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-snug">
                            Basic invoicing features for small businesses at no cost.
                          </p>
                        </div>
                      </div>

                      {/* Middle: 2 Columns of Features */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 lg:border-l lg:border-slate-200 lg:pl-8 text-xs sm:text-[13px] flex-1">
                        <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>100 Invoices Free / Year</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>Festival Posts Only</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>3 Employees Free</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>100 WhatsApp Msgs</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>50 Leads Free (Manual)</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span>No Admin Panel</span>
                        </div>
                      </div>

                      {/* Right: Employee Limit & Price */}
                      <div className="flex items-center justify-between lg:justify-end gap-6 lg:border-l lg:border-slate-200 lg:pl-8">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 whitespace-nowrap">
                          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Up to 3 employees</span>
                        </div>
                        <div className="border border-orange-200/90 bg-orange-50/50 rounded-xl px-4 py-2 flex items-baseline gap-1 shrink-0">
                          <span className="text-3xl font-black text-[#e77817]">₹0</span>
                          <span className="text-xs text-slate-500 font-semibold">/month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. MIDDLE 6 CARDS (3x2 GRID) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Card 1: Business Accounting */}
                  {(() => {
                    const isSelected = finalSelected.has("accounting");
                    return (
                      <div
                        onClick={() => togglePlan("accounting")}
                        className={`rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? "border-[#e77817] ring-2 ring-[#e77817]/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          {/* Checkbox at top-left */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-[#e77817] border-[#e77817] text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Header */}
                          <div className="flex items-start gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs">
                              <Calculator className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 leading-snug">Business Accounting</h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                Full billing, sales, purchases & inventory management.
                              </p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900">₹599</span>
                              <span className="text-xs text-slate-500 font-semibold">/month</span>
                            </div>
                            <div className="mt-1.5 inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                              Save 17% yearly
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2.5 mb-6 text-xs sm:text-[13px] text-slate-600 font-medium">
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Unlimited Invoices</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Estimates & POs</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Inventory Management</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>10 Employees Included</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>+ ₹29 / Extra Employee</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>500 WhatsApp Msgs / Mo</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-700 font-semibold pt-1">
                              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Up to 10 employees</span>
                            </div>
                          </div>
                        </div>

                        {/* Button */}
                        <div className="mt-auto pt-2 flex justify-end">
                          <Link
                            to="/register?plan=accounting"
                            onClick={(e) => e.stopPropagation()}
                            className="border border-[#e77817] text-[#e77817] hover:bg-[#e77817] hover:text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1 transition-all duration-200 shadow-2xs"
                          >
                            <span>Get Started</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 2: Business HR */}
                  {(() => {
                    const isSelected = finalSelected.has("hr");
                    return (
                      <div
                        onClick={() => togglePlan("hr")}
                        className={`rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? "border-[#e77817] ring-2 ring-[#e77817]/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          {/* Checkbox at top-left */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-[#e77817] border-[#e77817] text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Header */}
                          <div className="flex items-start gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 shadow-2xs">
                              <Users className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 leading-snug">Business HR</h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                Complete HR solution — attendance, payroll, leaves & shifts.
                              </p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900">₹599</span>
                              <span className="text-xs text-slate-500 font-semibold">/month</span>
                            </div>
                            <div className="mt-1.5 inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                              Save 17% yearly
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2.5 mb-6 text-xs sm:text-[13px] text-slate-600 font-medium">
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>10 Employees Included</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>+ ₹29 / Extra Employee</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Attendance & Payroll</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Shifts & Leaves</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>500 WhatsApp Msgs / Mo</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-700 font-semibold pt-1">
                              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Up to 10 employees</span>
                            </div>
                          </div>
                        </div>

                        {/* Button */}
                        <div className="mt-auto pt-2 flex justify-end">
                          <Link
                            to="/register?plan=hr"
                            onClick={(e) => e.stopPropagation()}
                            className="border border-[#e77817] text-[#e77817] hover:bg-[#e77817] hover:text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1 transition-all duration-200 shadow-2xs"
                          >
                            <span>Get Started</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 3: Business CRM */}
                  {(() => {
                    const isSelected = finalSelected.has("crm");
                    return (
                      <div
                        onClick={() => togglePlan("crm")}
                        className={`rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? "border-[#e77817] ring-2 ring-[#e77817]/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          {/* Checkbox at top-left */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-[#e77817] border-[#e77817] text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Header */}
                          <div className="flex items-start gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-500 shadow-2xs">
                              <Target className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 leading-snug">Business CRM</h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                Manage leads, deals, sales pipeline and customer relationships.
                              </p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900">₹349</span>
                              <span className="text-xs text-slate-500 font-semibold">/month</span>
                            </div>
                            <div className="mt-1.5 inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                              Save 16% yearly
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2.5 mb-6 text-xs sm:text-[13px] text-slate-600 font-medium">
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Unlimited Leads</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>API Integrations</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Sales Pipeline</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>10 Employees Included</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>+ ₹29 / Extra Employee</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>500 WhatsApp Msgs / Mo</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-700 font-semibold pt-1">
                              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Up to 10 employees</span>
                            </div>
                          </div>
                        </div>

                        {/* Button */}
                        <div className="mt-auto pt-2 flex justify-end">
                          <Link
                            to="/register?plan=crm"
                            onClick={(e) => e.stopPropagation()}
                            className="border border-[#e77817] text-[#e77817] hover:bg-[#e77817] hover:text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1 transition-all duration-200 shadow-2xs"
                          >
                            <span>Get Started</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 4: Business Promotion */}
                  {(() => {
                    const isSelected = finalSelected.has("promotion");
                    return (
                      <div
                        onClick={() => togglePlan("promotion")}
                        className={`rounded-2xl border bg-white p-6 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? "border-[#e77817] ring-2 ring-[#e77817]/20 shadow-md"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          {/* Checkbox at top-left */}
                          <div className="flex items-start justify-between mb-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? "bg-[#e77817] border-[#e77817] text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Header */}
                          <div className="flex items-start gap-3.5 mb-5">
                            <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0 text-pink-500 shadow-2xs">
                              <Megaphone className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 leading-snug">Business Promotion</h4>
                              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                Festival posters, WhatsApp & broadcast marketing campaigns.
                              </p>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="mb-5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-slate-900">₹349</span>
                              <span className="text-xs text-slate-500 font-semibold">/month</span>
                            </div>
                            <div className="mt-1.5 inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                              Save 16% yearly
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2.5 mb-6 text-xs sm:text-[13px] text-slate-600 font-medium">
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>All Poster Categories</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>Email Campaigns</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>10 Employees Included</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>+ ₹29 / Extra Employee</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[2.5]" />
                              <span>500 WhatsApp Msgs / Mo</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-700 font-semibold pt-1">
                              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Up to 10 employees</span>
                            </div>
                          </div>
                        </div>

                        {/* Button */}
                        <div className="mt-auto pt-2 flex justify-end">
                          <Link
                            to="/register?plan=promotion"
                            onClick={(e) => e.stopPropagation()}
                            className="border border-[#e77817] text-[#e77817] hover:bg-[#e77817] hover:text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1 transition-all duration-200 shadow-2xs"
                          >
                            <span>Get Started</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Card 5: Feedback Management (Coming Soon) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between relative">
                    <div>
                      {/* Checkbox (inactive) */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-5 h-5 rounded border border-slate-200 bg-slate-50 cursor-not-allowed"></div>
                      </div>

                      {/* Header */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 leading-snug">Feedback Management</h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Collect, manage and analyze customer feedback easily.
                          </p>
                        </div>
                      </div>

                      {/* Center Graphic Illustration */}
                      <div className="my-8 py-4 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-blue-50/70 border border-blue-100/60 flex items-center justify-center relative mb-4 shadow-inner">
                          <div className="relative">
                            <div className="w-13 h-10 bg-blue-500 rounded-lg shadow-md flex items-center justify-center p-2">
                              <div className="space-y-1 w-full">
                                <div className="h-1 bg-white rounded-full w-full"></div>
                                <div className="h-1 bg-white/70 rounded-full w-3/4"></div>
                                <div className="h-1 bg-white/50 rounded-full w-1/2"></div>
                              </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow-sm">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-black text-slate-900">Coming Soon</div>
                        <p className="text-xs text-slate-500 text-center max-w-[210px] mt-1">
                          Be the first to know when this feature is available!
                        </p>
                      </div>
                    </div>

                    {/* Notify Me Button */}
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        onClick={() => toast({ title: "Notification Request Received", description: "We will alert you as soon as Feedback Management launches!" })}
                        className="w-full border border-orange-300 hover:border-orange-400 bg-white hover:bg-orange-50 text-[#e77817] font-bold text-xs rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Notify Me</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 6: Business Analysis (Coming Soon) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between relative">
                    <div>
                      {/* Checkbox (inactive) */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-5 h-5 rounded border border-slate-200 bg-slate-50 cursor-not-allowed"></div>
                      </div>

                      {/* Header */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600 shadow-2xs">
                          <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 leading-snug">Business Analysis</h4>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Get actionable insights to grow your business.
                          </p>
                        </div>
                      </div>

                      {/* Center Graphic Illustration */}
                      <div className="my-8 py-4 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-purple-50/70 border border-purple-100/60 flex items-center justify-center relative mb-4 shadow-inner">
                          <div className="flex items-end gap-1.5 h-10 px-1">
                            <div className="w-2.5 bg-purple-300 rounded-t h-4"></div>
                            <div className="w-2.5 bg-purple-400 rounded-t h-7"></div>
                            <div className="w-2.5 bg-purple-600 rounded-t h-10"></div>
                            <div className="w-4 h-4 rounded-full bg-indigo-500 ml-1 mb-0.5 shadow-xs"></div>
                          </div>
                        </div>
                        <div className="text-lg font-black text-slate-900">Coming Soon</div>
                        <p className="text-xs text-slate-500 text-center max-w-[210px] mt-1">
                          Be the first to know when this feature is available!
                        </p>
                      </div>
                    </div>

                    {/* Notify Me Button */}
                    <div className="mt-auto pt-2">
                      <button
                        type="button"
                        onClick={() => toast({ title: "Notification Request Received", description: "We will alert you as soon as Business Analysis launches!" })}
                        className="w-full border border-orange-300 hover:border-orange-400 bg-white hover:bg-orange-50 text-[#e77817] font-bold text-xs rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Notify Me</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM BANNER: Business Suite */}
                {(() => {
                  const isSelected = finalSelected.has("suite");
                  return (
                    <div
                      onClick={() => togglePlan("suite")}
                      className={`rounded-2xl border bg-white p-5 sm:p-6 transition-all duration-200 cursor-pointer shadow-xs ${
                        isSelected
                          ? "border-[#e77817] ring-2 ring-[#e77817]/20 shadow-md"
                          : "border-slate-200/90 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Left: Checkbox + Icon + Details */}
                        <div className="flex items-start gap-4 lg:w-[36%]">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-1 ${
                            isSelected ? "bg-[#e77817] border-[#e77817] text-white" : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-[#e77817] flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/25">
                            <Crown className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">Business Suite</h3>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-[#e77817] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">Selected</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                              Complete all-in-one business suite with full system access!
                            </p>
                            <div className="flex items-center gap-2.5 mt-2">
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#e77817]">₹1,499</span>
                                <span className="text-xs text-slate-500 font-semibold">/month</span>
                              </div>
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                                Save 17% yearly
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: 2 Columns of Features */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 lg:border-l lg:border-slate-200 lg:pl-8 text-xs sm:text-[13px] flex-1">
                          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>All Premium Features</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>Full Suite Admin</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>10 Employees Included</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>500 WhatsApp Msgs / Mo</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
                            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span>+ ₹29 / Extra Employee</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 font-semibold">
                            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Up to 10 employees</span>
                          </div>
                        </div>

                        {/* Right: Solid Action Button */}
                        <div className="flex items-center justify-end lg:border-l lg:border-slate-200 lg:pl-8">
                          <Link
                            to="/register?plan=suite"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#e77817] hover:bg-[#d46a0f] text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all duration-200 text-sm whitespace-nowrap"
                          >
                            <span>Get Started</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Floating Checkout Bar */}
                {finalSelected.size > 0 && (
                  <div className="sticky bottom-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 mx-4 md:mx-auto max-w-4xl mt-8">
                    <div className="bg-navy/95 backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-full shadow-2xl shadow-navy/50 p-4 md:p-3 md:pl-8 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 w-full">
                      <div className="flex items-center gap-6">
                        <div className="bg-white/10 h-12 w-12 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{finalSelected.size}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-300 uppercase tracking-wider">Total Selected</div>
                          <div className="text-3xl font-black text-white">₹{totalMonthly.toLocaleString('en-IN')}<span className="text-lg font-medium text-slate-400">/mo</span></div>
                        </div>
                      </div>
                      <Button size="lg" className="w-full md:w-auto h-14 px-10 text-lg font-bold bg-[#e77817] hover:bg-[#d46a0f] text-white rounded-full shadow-[0_0_20px_rgba(231,120,23,0.4)]" asChild>
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
