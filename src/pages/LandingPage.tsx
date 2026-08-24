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
  Globe, PlayCircle, ShieldCheck, Building2, Quote, Timer,
} from "lucide-react";
import logoImg from "@/assets/logo.png";

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <img src={`${logoImg}?v=${Date.now()}`} alt="Assay Biz" className="h-8 w-auto object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">{L.nav_features}</a>
            <a href="#compare" className="hover:text-foreground">{L.nav_compare}</a>
            <a href="#pricing" className="hover:text-foreground">{L.nav_pricing}</a>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-full border bg-muted/50 p-0.5 text-xs">
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full transition ${lang === "en" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >EN</button>
              <button
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 rounded-full transition ${lang === "hi" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >हिंदी</button>
            </div>
            <Button variant="ghost" size="sm" asChild><Link to="/login">{L.nav_login}</Link></Button>
            <Button size="sm" asChild><a href="#pricing">View Plans</a></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="secondary" className="mb-4 gap-1.5 py-1.5 px-3">
              <Sparkles className="h-3.5 w-3.5" /> {L.hero_eyebrow}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-navy">
              {L.hero_title}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">{L.hero_sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2 text-base h-12 px-6" asChild>
                <a href="#pricing">{L.cta_primary} <ArrowRight className="h-4 w-4" /></a>
              </Button>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 text-xs font-medium">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> {L.no_card_badge}
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> {L.speed_claim}</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" /> Setup in 30s</span>
            </div>
          </div>

          {/* Mock invoice preview */}
          <div id="demo" className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-emerald-400/10 blur-2xl rounded-3xl" />
            <Card className="relative overflow-hidden shadow-2xl border-2">
              <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="h-4 w-4" /> Message Preview
                </div>
                <span className="text-xs opacity-80">Just now</span>
              </div>
              <div className="p-5 bg-muted/30">
                <div className="bg-background rounded-lg p-4 shadow-sm space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Invoice #INV-2026-0184</span>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Due ₹24,750</Badge>
                  </div>
                  <div className="text-muted-foreground text-xs">Sharma Hardware → Kumar Constructions</div>
                  <div className="border-t pt-3 space-y-1.5">
                    {[
                      ["Cement Bags × 20", "₹8,400"],
                      ["Steel Rods × 50", "₹14,200"],
                      ["GST @ 18%", "₹2,150"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded bg-foreground grid place-items-center">
                        <div className="h-7 w-7 bg-background rounded-sm grid place-items-center text-[8px] font-bold">UPI</div>
                      </div>
                      <div className="text-xs">
                        <div className="font-medium">Pay via UPI</div>
                        <div className="text-muted-foreground">Scan to pay instantly</div>
                      </div>
                    </div>
                    <Button size="sm" className="h-8">Pay ₹24,750</Button>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <div className="bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Check className="h-3 w-3" /> Sent & delivered
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Trust strip */}
        <div className="border-t bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: "500+", l: L.trust_users },
              { v: "₹820 Cr+", l: L.trust_invoices },
              { v: "4.8 ★", l: L.trust_rating },
              { v: "99.99%", l: L.trust_uptime },
            ].map(s => (
              <div key={s.l}>
                <div className="text-2xl md:text-3xl font-bold tracking-tight text-navy">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance badges */}
      <section className="border-b py-12 bg-background">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6">
            {L.badges_title}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {complianceBadges.map(b => (
              <div key={b.label} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-card text-sm">
                <b.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium truncate">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Share highlight */}
      <section className="py-20 border-b bg-emerald-50/40 ">
        <div className="mx-auto max-w-6xl px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1.5 mb-4"><MessageCircle className="h-3.5 w-3.5" /> {L.wa_eyebrow}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-navy">{L.wa_title}</h2>
            <p className="mt-4 text-muted-foreground text-lg">{L.wa_sub}</p>
            <ul className="mt-6 space-y-3">
              {L.wa_bullets.map(b => (
                <li key={b} className="flex gap-3"><Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" /><span>{b}</span></li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] max-w-sm mx-auto rounded-3xl border-8 border-foreground/90 bg-emerald-100  overflow-hidden shadow-2xl">
              <div className="bg-emerald-600 text-white text-xs px-4 py-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center font-bold">K</div>
                <div><div className="font-semibold">Kumar Constructions</div><div className="opacity-80">online</div></div>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <div className="bg-white  p-3 rounded-lg rounded-tl-none shadow max-w-[85%]">
                  Hi! Aapka invoice ready hai 👇
                </div>
                <div className="bg-white  p-3 rounded-lg rounded-tl-none shadow max-w-[85%]">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <FileText className="h-5 w-5 text-primary" />
                    <div><div className="font-semibold">INV-2026-0184.pdf</div><div className="text-muted-foreground">2 pages · PDF</div></div>
                  </div>
                  <div className="pt-2 text-muted-foreground">₹24,750 · Pay via UPI</div>
                </div>
                <div className="ml-auto bg-emerald-200  p-3 rounded-lg rounded-tr-none shadow max-w-[70%]">
                  Paid ✅ UTR: 802145
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-b">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-navy">{L.feat_title}</h2>
            <p className="mt-3 text-muted-foreground text-lg">{L.feat_sub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <Card key={f.title} className="p-6 hover:shadow-md transition border-muted">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1.5 text-navy">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="py-20 border-b bg-muted/30">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-navy">{L.cmp_title}</h2>
            <p className="mt-3 text-muted-foreground text-lg">{L.cmp_sub}</p>
          </div>
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="p-4 font-semibold text-primary bg-primary/5">Assay Biz</th>
                  <th className="p-4 font-medium text-muted-foreground">Vyapar</th>
                  <th className="p-4 font-medium text-muted-foreground">Zoho Invoice</th>
                  <th className="p-4 font-medium text-muted-foreground">ClearTax</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(row => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="p-4">{row.label}</td>
                    <td className="p-4 text-center bg-primary/5"><Tick v={row.satah} /></td>
                    <td className="p-4 text-center"><Tick v={row.vyapar} /></td>
                    <td className="p-4 text-center"><Tick v={row.zoho} /></td>
                    <td className="p-4 text-center"><Tick v={row.cleartax} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-b">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-navy">{L.test_title}</h2>
            <div className="mt-3 flex items-center justify-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              <span className="ml-2 text-foreground font-medium">4.8 average · 2,140+ reviews</span>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {(customReviews || testimonials).map((t, idx) => (
              <Card key={idx} className="p-6">
                <Quote className="h-6 w-6 text-primary/30 mb-3" />
                <p className="text-foreground leading-relaxed">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-3 pt-4 border-t">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-emerald-500 grid place-items-center text-primary-foreground font-semibold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                  <div className="ml-auto flex text-amber-500">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 gap-1.5 py-1.5 px-3">
              <Zap className="h-3.5 w-3.5" /> Choose Your Plans
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-navy">{L.pricing_title}</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
              Select one or more plans for your business. All plans include 14-day free trial.
            </p>
          </div>

          {(() => {
            const allPlans = dbPlans.filter(p => p.name !== "free" || allowFreePlan);

            const planIcons: Record<string, { icon: string; color: string; gradient: string; desc: string }> = {
              free: { icon: "🆓", color: "text-slate-600", gradient: "from-slate-400 to-slate-500", desc: "Get started with basic invoicing features at no cost." },
              plan_2: { icon: "📄", color: "text-blue-600", gradient: "from-blue-500 to-blue-600", desc: "Full sales & inventory management for growing businesses." },
              plan_3: { icon: "🏢", color: "text-amber-600", gradient: "from-amber-500 to-orange-500", desc: "Complete business suite with purchase, accounts & reports. CRM & Marketing included free!" },
              plan_4: { icon: "👥", color: "text-indigo-600", gradient: "from-indigo-500 to-indigo-600", desc: "Complete HR solution — attendance, leaves, payroll & employee management." },
              plan_5: { icon: "🎯", color: "text-pink-600", gradient: "from-pink-500 to-rose-500", desc: "Manage leads, deals, pipeline and customer relationships." },
              plan_6: { icon: "📢", color: "text-orange-600", gradient: "from-orange-500 to-red-500", desc: "SMS campaigns, email marketing, journeys and automation." },
            };

            const togglePlan = (planName: string) => {
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

            // Calculate total monthly price
            let totalMonthly = 0;
            finalSelected.forEach(name => {
              const plan = allPlans.find((p: any) => p.name === name);
              if (!plan) return;
              if (hasPlan3 && (name === "plan_5" || name === "plan_6")) return;
              totalMonthly += plan.price_monthly;
            });

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {allPlans.map((p: any) => {
                    const meta = planIcons[p.name] || { icon: "📦", color: "text-primary", gradient: "from-primary to-primary", desc: "" };
                    const isIncludedFree = hasPlan3 && (p.name === "plan_5" || p.name === "plan_6");
                    const isSelected = finalSelected.has(p.name);
                    const isPopular = p.name === "plan_3";
                    
                    return (
                      <Card 
                        key={p.id} 
                        onClick={() => !isIncludedFree && togglePlan(p.name)}
                        className={`relative flex flex-col overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${isSelected ? "border-2 border-primary shadow-lg ring-1 ring-primary/20" : isIncludedFree ? "border-2 border-emerald-500/50 opacity-90" : "border hover:border-primary/30"}`}
                      >
                        {isPopular && (
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-primary" />
                        )}
                        {isPopular && (
                          <Badge className="absolute -top-0.5 right-4 rounded-t-none rounded-b-lg bg-primary text-primary-foreground shadow-md">Most Popular</Badge>
                        )}
                        {isIncludedFree && (
                          <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0">Free with Plan 3</Badge>
                        )}
                        <div className="p-6 flex-1 flex flex-col">
                          <div className="flex items-start gap-3 mb-3">
                            {/* Checkbox */}
                            <div className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"}`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-xl shadow-sm`}>
                                {meta.icon}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-navy">{p.display_name}</h3>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{meta.desc}</p>
                          <div className="flex items-baseline gap-1 mb-1">
                            {isIncludedFree ? (
                              <span className="text-2xl font-extrabold text-emerald-500">Free</span>
                            ) : (
                              <>
                                <span className="text-3xl font-extrabold tracking-tight">{'\u20B9'}{(p.price_monthly / 100).toLocaleString()}</span>
                                <span className="text-muted-foreground text-sm">/mo</span>
                              </>
                            )}
                          </div>
                          {!isIncludedFree && (
                            <div className="text-xs text-muted-foreground mb-4">
                              {'\u20B9'}{(p.price_yearly / 100).toLocaleString()}/year {p.price_monthly > 0 && `(save ${Math.round((1 - p.price_yearly / (p.price_monthly * 12)) * 100)}%)`}
                            </div>
                          )}
                          <div className="mt-auto pt-4 border-t space-y-2.5">
                            {Array.isArray(p.features) && p.features.map((f: string, i: number) => (
                              <div key={i} className="flex gap-2.5 text-sm">
                                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">{f}</span>
                              </div>
                            ))}
                            {p.employee_limit && (
                              <div className="flex gap-2.5 text-sm">
                                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-muted-foreground">Up to {p.employee_limit} employees</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Floating Checkout Bar */}
                {finalSelected.size > 0 && (
                  <div className="sticky bottom-4 z-30 bg-background/95 backdrop-blur-lg border-2 border-primary/20 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 max-w-3xl mx-auto">
                    <div>
                      <div className="text-sm text-muted-foreground">{finalSelected.size} plan{finalSelected.size > 1 ? "s" : ""} selected</div>
                      <div className="text-2xl font-bold">{'\u20B9'}{(totalMonthly / 100).toLocaleString('en-IN')}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </div>
                    <Button size="lg" className="w-full md:w-auto gap-2 text-base h-12 px-8 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-md" asChild>
                      <Link to={`/register?plan=${Array.from(finalSelected).join(",")}`}>
                        Get Started <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            );
          })()}

          <p className="text-center text-xs text-muted-foreground mt-8">
            All prices exclude GST. Cancel anytime. 14-day money-back guarantee on paid plans.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-b">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{L.final_title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{L.final_sub}</p>
          <Button size="lg" className="mt-7 gap-2 text-base h-12 px-8" asChild>
            <a href="#pricing">{L.final_cta} <ArrowRight className="h-4 w-4" /></a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 text-sm text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs">S</div>
            <span>© {new Date().getFullYear()} Assay Biz Invoice. Made in India.</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
            <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />
              <button onClick={() => setLang(lang === "en" ? "hi" : "en")} className="hover:text-foreground">
                {lang === "en" ? "हिंदी" : "English"}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
