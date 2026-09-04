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
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { SocialMediaLinks } from "@/components/shared/SocialMediaLinks";

type Lang = "en" | "hi";

const t = {
  en: {
    nav_features: "Features", nav_pricing: "Pricing", nav_compare: "Compare", nav_login: "Sign in",
    hero_eyebrow: "Built for Indian SMBs · 100% GST Ready",
    hero_title: "Send GST invoices in 30 seconds.",
    hero_sub: "Assay Biz is the fastest GST-compliant billing software for shopkeepers, freelancers and growing businesses. Create, share and get paid — all in one place.",
    cta_primary: "Create your first invoice — Free",
    cta_secondary: "Watch 60-sec demo",
    trust_users: "500+ businesses trust Assay Biz",
    trust_invoices: "₹820 Cr+ invoiced",
    trust_rating: "4.8 / 5 on Play Store",
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
    pricing_cta_pro: "Start 14-day trial",
    final_title: "Ready to send your first GST invoice?",
    final_sub: "No credit card. No setup. Live in 30 seconds.",
    final_cta: "Try 14 day trial",
  },
  hi: {
    nav_features: "फीचर्स", nav_pricing: "प्राइसिंग", nav_compare: "तुलना", nav_login: "साइन इन",
    hero_eyebrow: "भारतीय व्यापारियों के लिए · 100% GST रेडी",
    hero_title: "30 सेकंड में GST बिल भेजें।",
    hero_sub: "Assay Biz भारत का सबसे तेज़ GST बिलिंग सॉफ़्टवेयर है — दुकानदार, फ्रीलांसर और बढ़ते बिज़नेस के लिए। बिल बनाओ, भेजो, पेमेंट लो — एक ही जगह।",
    cta_primary: "अभी मुफ़्त बिल बनाएं",
    cta_secondary: "60-सेकंड डेमो देखें",
    trust_users: "500+ बिज़नेस Assay Biz पर भरोसा करते हैं",
    trust_invoices: "₹820 करोड़+ की बिलिंग",
    trust_rating: "Play Store पर 4.8 / 5",
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
    pricing_cta_pro: "14-दिन ट्रायल शुरू करें",
    final_title: "अपना पहला GST बिल भेजने के लिए तैयार?",
    final_sub: "कोई कार्ड नहीं। कोई सेटअप नहीं। 30 सेकंड में लाइव।",
    final_cta: "Try 14 day trial",
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

const features = [
  { icon: Zap, title: "30-second invoicing", desc: "Pre-filled GST rates, HSN lookup, auto-numbering. Done before your chai gets cold." },
  { icon: MessageCircle, title: "Share + UPI QR", desc: "Send a polished PDF with a UPI QR. Customers pay in one tap." },
  { icon: Package, title: "Inventory with stock ledger", desc: "Auto-deduct stock on sales, restock on credit notes. Negative-stock warnings." },
  { icon: FileText, title: "GSTR-1, GSTR-3B, HSN summary", desc: "Generate filing-ready JSON and CSV. Tally export included." },
  { icon: BarChart3, title: "P&L, receivables, aging", desc: "Know who owes you, what's overdue, and what you actually earned." },
  { icon: Smartphone, title: "Works offline, installs as app", desc: "PWA — install on phone or laptop. Use it even on a weak network." },
];

type Cell = boolean | "partial";
const comparison: { label: string; satah: Cell; vyapar: Cell; zoho: Cell; cleartax: Cell }[] = [
  { label: "Instant share with UPI QR", satah: true, vyapar: "partial", zoho: false, cleartax: false },
  { label: "GSTR-1 + 3B export (free tier)", satah: true, vyapar: false, zoho: false, cleartax: "partial" },
  { label: "Unlimited invoices on free plan", satah: true, vyapar: "partial", zoho: false, cleartax: false },
  { label: "Customer portal (no login)", satah: true, vyapar: false, zoho: true, cleartax: false },
  { label: "Multi-warehouse inventory", satah: true, vyapar: true, zoho: true, cleartax: false },
  { label: "Hindi + regional UI", satah: true, vyapar: true, zoho: "partial", cleartax: "partial" },
  { label: "Works as installable app (PWA)", satah: true, vyapar: false, zoho: false, cleartax: false },
  { label: "Starts free, no card needed", satah: true, vyapar: false, zoho: false, cleartax: false },
];

const testimonials = [
  { name: "Rajesh Sharma", role: "Owner, Sharma Hardware · Jaipur", quote: "Pehle Excel pe bill banata tha, ab seedha bhej deta hoon. Customer 5 minute mein UPI se paisa de deta hai.", rating: 5 },
  { name: "Priya Mehta", role: "Founder, Mehta Textiles · Surat", quote: "GSTR-1 file karne mein pehle CA ko 3 din lagte the. Assay Biz se 10 minute mein JSON ready ho jata hai. Game changer.", rating: 5 },
  { name: "Amit Patel", role: "CA, Patel & Associates · Ahmedabad", quote: "My 40+ clients moved from Tally + Vyapar to Assay Biz. The HSN summary and 3B export saves us hours every month.", rating: 5 },
  { name: "Sneha Iyer", role: "Freelance Designer · Bengaluru", quote: "Clean, fast, no bloat. The portal link means clients pay without me chasing. Worth every rupee.", rating: 5 },
];

function Tick({ v }: { v: boolean | "partial" }) {
  if (v === true) return <Check className="h-5 w-5 text-emerald-600 mx-auto" />;
  if (v === "partial") return <span className="text-amber-600 text-sm font-medium">Partial</span>;
  return <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />;
}

export default function LandingPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("satah-lang") as Lang) || "en");
  const [allowFreePlan, setAllowFreePlan] = useState(true);
  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [customReviews, setCustomReviews] = useState<any[] | null>(null);
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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-white/95 px-3 py-1.5 rounded-lg shadow-sm border border-white/20">
              <img src={`${logoImg}?v=${Date.now()}`} alt="Assay Biz" className="h-7 w-auto object-contain" />
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-primary transition-colors">{L.nav_features}</a>
            <a href="#compare" className="hover:text-primary transition-colors">{L.nav_compare}</a>
            <a href="#pricing" className="hover:text-primary transition-colors">{L.nav_pricing}</a>
            <Link to="/brochure" className="hover:text-primary transition-colors flex items-center gap-1.5 text-indigo-300">
              <FileText className="w-4 h-4 text-indigo-400" /> Brochure
            </Link>
            <Link to="/pamphlet" className="hover:text-primary transition-colors flex items-center gap-1.5 text-indigo-300">
              <Layers className="w-4 h-4 text-indigo-400" /> Pamphlet
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10 hidden sm:flex font-medium" asChild><Link to="/login">{L.nav_login}</Link></Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 rounded-full px-6" asChild><a href="#pricing">View Plans</a></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy pt-20 pb-28 lg:pt-28 lg:pb-36">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
        
        <div className="mx-auto max-w-7xl px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <Badge className="mb-6 gap-2 py-1.5 px-4 bg-white/10 hover:bg-white/15 text-emerald-400 border border-emerald-500/30 rounded-full backdrop-blur-sm shadow-sm inline-flex">
              <Sparkles className="h-4 w-4" /> {L.hero_eyebrow}
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white mb-6">
              {L.hero_title}
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
              {L.hero_sub}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
              <Button size="lg" className="h-14 px-8 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/40 rounded-full w-full sm:w-auto" asChild>
                <a href="#pricing">{L.cta_primary} <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-slate-400 font-medium">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {L.no_card_badge}</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {L.speed_claim}</span>
            </div>
          </div>
          
          {/* Mock invoice preview */}
          <div id="demo" className="relative lg:col-span-5 hidden md:block">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 to-emerald-400/20 blur-2xl rounded-[2rem] opacity-70" />
            <div className="relative rounded-[2rem] border border-white/10 bg-navy/80 p-2 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-slate-900 text-slate-300 px-5 py-3 flex items-center justify-between rounded-t-2xl border-b border-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp Preview
                </div>
                <span className="text-xs opacity-70">Just now</span>
              </div>
              <div className="p-5 bg-[url('https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png')] bg-repeat bg-center">
                <div className="bg-emerald-950/90 backdrop-blur-sm border border-emerald-800/50 rounded-xl p-4 shadow-sm space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Invoice #INV-2026-0184</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30">Due ₹24,750</Badge>
                  </div>
                  <div className="text-slate-400 text-xs">Sharma Hardware → Kumar Constructions</div>
                  <div className="border-t border-emerald-800/50 pt-3 space-y-2">
                    {[
                      ["Cement Bags × 20", "₹8,400"],
                      ["Steel Rods × 50", "₹14,200"],
                      ["GST @ 18%", "₹2,150"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs"><span className="text-slate-400">{k}</span><span className="font-medium text-white">{v}</span></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-emerald-800/50 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white grid place-items-center">
                        <div className="h-7 w-7 rounded-sm grid place-items-center text-[10px] font-extrabold text-navy border border-navy/10">UPI</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-white">Pay via UPI</div>
                        <div className="text-emerald-400">Scan & Pay</div>
                      </div>
                    </div>
                    <Button size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg px-4 shadow-md">Pay ₹24,750</Button>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm font-medium">
                    <Check className="h-3 w-3" /> Delivered
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust strip */}
      <section className="bg-white border-b py-10 relative -mt-8 z-20 mx-4 sm:mx-8 lg:mx-auto max-w-6xl rounded-2xl shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center divide-x divide-slate-100">
          {[
            { v: "500+", l: L.trust_users, c: "text-primary" },
            { v: "₹820 Cr+", l: L.trust_invoices, c: "text-emerald-500" },
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

      {/* Compliance badges */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
            {L.badges_title}
          </p>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {complianceBadges.map(b => (
              <div key={b.label} className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow hover:border-primary/30">
                <b.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold text-slate-700">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy mb-6">{L.feat_title}</h2>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed">{L.feat_sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-100 bg-slate-50/50 hover:bg-white group">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-navy">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp highlight */}
      <section className="py-24 bg-navy relative overflow-hidden text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 gap-2 mb-6 py-1.5 px-4 rounded-full">
              <MessageCircle className="h-4 w-4" /> {L.wa_eyebrow}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">{L.wa_title}</h2>
            <p className="text-lg text-slate-300 leading-relaxed mb-8">{L.wa_sub}</p>
            <ul className="space-y-4">
              {L.wa_bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 grid place-items-center shrink-0">
                    <Check className="h-4 w-4" />
                  </div>
                  <span className="text-slate-200 font-medium text-lg">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
             <div className="aspect-[9/19] rounded-[3rem] border-[12px] border-slate-900 bg-slate-900 overflow-hidden shadow-2xl shadow-black/50 relative">
               <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-20 rounded-b-xl w-40 mx-auto"></div>
               <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />
               <div className="absolute inset-0 flex flex-col bg-[#ece5dd]/90">
                 <div className="bg-[#075e54] text-white p-4 pt-10 flex items-center gap-3 shadow-md z-10">
                   <div className="h-10 w-10 rounded-full bg-slate-300 shrink-0 border border-white/20"></div>
                   <div>
                     <div className="font-bold">Kumar Constructions</div>
                     <div className="text-xs text-white/80">typing...</div>
                   </div>
                 </div>
                 <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                   <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm max-w-[85%] relative text-slate-800">
                     Hello sir, sending the invoice for cement and steel delivery. 👇
                   </div>
                   <div className="bg-white p-1 rounded-2xl rounded-tl-none shadow-sm text-sm max-w-[85%] relative">
                     <div className="bg-slate-100 rounded-xl p-3 flex items-center gap-3 mb-2">
                        <div className="bg-[#ff0000] p-2 rounded-lg"><FileText className="h-5 w-5 text-white" /></div>
                        <div>
                          <div className="font-bold text-slate-700">INV-2026-0184.pdf</div>
                          <div className="text-xs text-slate-500">2 Pages • 245 KB</div>
                        </div>
                     </div>
                     <div className="px-2 pb-2">
                        <div className="font-bold text-slate-800 text-lg mb-1">₹24,750</div>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 shadow-md">Pay via UPI</Button>
                     </div>
                   </div>
                   <div className="ml-auto bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none shadow-sm text-sm max-w-[80%] relative text-slate-800 flex justify-between items-end">
                     <span>Payment done. Thanks! ✅</span>
                     <span className="text-[10px] text-slate-500 ml-2">10:42 AM</span>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-navy mb-6">{L.cmp_title}</h2>
            <p className="text-lg md:text-xl text-slate-500">{L.cmp_sub}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-sm bg-slate-50">Feature</th>
                    <th className="p-6 font-black text-xl text-white bg-navy text-center border-l border-white/10 shadow-inner">
                      Assay Biz
                    </th>
                    <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-sm bg-slate-50 text-center">Vyapar</th>
                    <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-sm bg-slate-50 text-center">Zoho Invoice</th>
                    <th className="p-6 font-bold text-slate-500 uppercase tracking-wider text-sm bg-slate-50 text-center">ClearTax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparison.map((row, idx) => (
                    <tr key={row.label} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 px-6 font-semibold text-slate-700">{row.label}</td>
                      <td className="p-5 text-center bg-navy/5 border-l border-navy/10"><Tick v={row.satah} /></td>
                      <td className="p-5 text-center"><Tick v={row.vyapar} /></td>
                      <td className="p-5 text-center"><Tick v={row.zoho} /></td>
                      <td className="p-5 text-center"><Tick v={row.cleartax} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white relative overflow-hidden">
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

            const planIcons = {
              free: { icon: "🆓", color: "text-slate-600", bg: "bg-slate-100", desc: "Basic invoicing features at no cost forever." },
              plan_2: { icon: "📦", color: "text-blue-600", bg: "bg-blue-100", desc: "Full sales & inventory management for growing businesses." },
              plan_3: { icon: "🏢", color: "text-primary", bg: "bg-primary/10", desc: "Complete business suite. CRM & Marketing included free!" },
              plan_4: { icon: "👥", color: "text-indigo-600", bg: "bg-indigo-100", desc: "Complete HR solution — attendance, payroll & employee management." },
              plan_5: { icon: "🎯", color: "text-pink-600", bg: "bg-pink-100", desc: "Manage leads, deals, pipeline and customer relationships." },
              plan_6: { icon: "📢", color: "text-rose-600", bg: "bg-rose-100", desc: "SMS campaigns, email marketing, journeys and automation." },
            };

            const togglePlan = (planName) => {
              setSelectedPlans(prev => 
                prev.includes(planName) ? prev.filter(n => n !== planName) : [...prev, planName]
              );
            };

            const hasPlan3 = selectedPlans.includes("plan_3");
            const finalSelected = new Set(selectedPlans);
            if (hasPlan3) {
              finalSelected.add("plan_5");
              finalSelected.add("plan_6");
            }

            let totalMonthly = 0;
            finalSelected.forEach(name => {
              const plan = allPlans.find((p) => p.name === name);
              if (!plan) return;
              if (hasPlan3 && (name === "plan_5" || name === "plan_6")) return;
              totalMonthly += plan.price_monthly;
            });

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                  {allPlans.map((p) => {
                    const meta = planIcons[p.name] || { icon: "✨", color: "text-primary", bg: "bg-primary/10", desc: "" };
                    const isIncludedFree = hasPlan3 && (p.name === "plan_5" || p.name === "plan_6");
                    const isSelected = finalSelected.has(p.name);
                    const isPopular = p.name === "plan_3";
                    
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
                            Free with Plan 3
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
                  <div className="sticky bottom-6 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-navy/95 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-navy/50 p-3 pl-8 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
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

      {/* Final CTA */}
      <section className="py-32 bg-navy relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="mx-auto max-w-4xl px-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8 leading-tight">{L.final_title}</h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">{L.final_sub}</p>
          <Button size="lg" className="h-16 px-12 text-xl font-bold bg-primary hover:bg-primary/90 text-white rounded-full shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:scale-105 transition-transform" asChild>
            <a href="#pricing">{L.final_cta}</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">A</div>
            <span className="text-slate-400 font-medium">© {new Date().getFullYear()} Assay Biz. Proudly Made in India.</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium hidden lg:inline">Connect with us:</span>
            <SocialMediaLinks iconSize="sm" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/brochure" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1.5 text-sm">
              <FileText className="w-4 h-4" /> Download Brochure
            </Link>
            <Link to="/pamphlet" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4" /> Download Pamphlet
            </Link>
            <a href="#features" className="text-slate-400 hover:text-white font-semibold transition-colors">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white font-semibold transition-colors">Pricing</a>
            <Link to="/login" className="text-primary font-bold hover:text-primary/80 transition-colors">Sign in to Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
