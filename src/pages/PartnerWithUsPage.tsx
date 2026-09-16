import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Handshake, Mail, Phone, User, Building,
  TrendingUp, Users, Shield, Headphones, IndianRupee,
  Sparkles, BadgePercent, BookOpen, Rocket, Globe,
  CheckCircle2, Star, Zap, BarChart3, Award,
} from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PartnerWithUsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    company: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast({ title: "Invalid Mobile", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        mobile: formData.mobile,
        company: formData.company,
        message: formData.message
      };

      const { error } = await supabase.from("feature_requests").insert({
        feature_name: "Partner With Us",
        request_type: "partner_request",
        user_email: formData.email,
        message: JSON.stringify(payload),
        status: "pending"
      });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "Thank you for showing interest. Our team will contact you shortly.",
        variant: "default",
      });

      setFormData({ name: "", email: "", mobile: "", company: "", message: "" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const partnerTypes = [
    {
      icon: Globe,
      title: "Reseller Partner",
      desc: "Sell Assay Biz to your clients and earn recurring commissions on every subscription.",
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-100",
    },
    {
      icon: BookOpen,
      title: "Referral Partner",
      desc: "Recommend Assay Biz to your network. Get rewarded for every successful conversion.",
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
    },
    {
      icon: Rocket,
      title: "Agency Partner",
      desc: "White-label Assay Biz tools for your agency clients. Full branding flexibility.",
      color: "text-purple-600",
      bg: "bg-purple-50 border-purple-100",
    },
    {
      icon: BarChart3,
      title: "CA / Accountant Partner",
      desc: "Manage multiple client businesses from a single partner dashboard with bulk tools.",
      color: "text-rose-600",
      bg: "bg-rose-50 border-rose-100",
    },
  ];

  const benefits = [
    { icon: IndianRupee, title: "Recurring Revenue", desc: "Earn up to 30% recurring commission on every active subscription you bring in." },
    { icon: Headphones, title: "Dedicated Partner Support", desc: "Get a dedicated partner manager, priority support queue, and direct escalation access." },
    { icon: BadgePercent, title: "Exclusive Discounts", desc: "Offer your clients special pricing with partner-exclusive discount codes and bundles." },
    { icon: Shield, title: "Co-Branding & Marketing", desc: "Access marketing collaterals, co-branded materials, and joint campaign opportunities." },
    { icon: TrendingUp, title: "Partner Dashboard", desc: "Track referrals, revenue, payouts, and client activity in a real-time analytics dashboard." },
    { icon: Award, title: "Growth Incentives", desc: "Unlock tier-based rewards — Bronze, Silver, Gold — with increasing benefits as you grow." },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-grow">

        {/* ═══════════ HERO SECTION ═══════════ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0e4f] via-[#28166f] to-[#1c1050]">
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e77817]/15 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#28166f]/40 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e77817]/20 border border-[#e77817]/30 text-[#ffaa47] text-xs font-bold uppercase tracking-wider mb-6">
                  <Handshake className="w-4 h-4" />
                  <span>Partnership Program</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
                  Grow Together.{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff9438] to-[#e77817]">
                    Earn Together.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
                  Join Assay Biz's partner ecosystem and unlock new revenue streams. Whether you're a CA, agency, freelancer, or reseller — we've built a program that rewards your growth as much as ours.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10">
                  <a
                    href="#partner-form"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#e77817] hover:bg-[#ff8a24] text-white font-bold text-base shadow-xl shadow-[#e77817]/30 transition-all duration-300 hover:scale-[1.03]"
                  >
                    Become a Partner <ArrowRight className="w-5 h-5" />
                  </a>
                  <a
                    href="#how-it-works"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-base border border-white/15 backdrop-blur-sm transition-all duration-300"
                  >
                    Learn How It Works
                  </a>
                </div>

                {/* Trust signals */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free to Join
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Minimum Commitment
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Onboarding
                  </span>
                </div>
              </div>

              {/* Right: Stats card */}
              <div className="hidden lg:flex flex-col items-center">
                <div className="w-full max-w-md bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#e77817] to-[#ff9438] rounded-2xl flex items-center justify-center shadow-lg shadow-[#e77817]/30">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-1">Partner Highlights</h3>
                    <p className="text-xs text-slate-400">Why top businesses choose Assay Biz</p>
                  </div>

                  <div className="space-y-5">
                    {[
                      { value: "Up to 30%", label: "Recurring Commission", icon: IndianRupee, color: "text-emerald-400" },
                      { value: "100+", label: "Active Partners", icon: Users, color: "text-[#ffaa47]" },
                      { value: "₹23 Cr+", label: "Invoiced by Partners", icon: TrendingUp, color: "text-blue-400" },
                      { value: "4.8 ★", label: "Partner Satisfaction", icon: Star, color: "text-amber-400" },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.05] border border-white/10">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                          <div className={`text-lg font-black ${stat.color}`}>{stat.value}</div>
                          <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ PARTNERSHIP TYPES ═══════════ */}
        <section id="how-it-works" className="py-20 sm:py-24 bg-[#fafbfc] border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#28166f] bg-[#28166f]/10 border border-[#28166f]/20 px-4 py-1.5 rounded-full mb-4">
                PARTNERSHIP MODELS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                Choose Your Partnership Path
              </h2>
              <p className="text-base text-slate-500 leading-relaxed">
                We've designed multiple partnership models so you can find the perfect fit for your business. Pick the one that aligns with your strengths.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {partnerTypes.map((pt, i) => (
                <div
                  key={i}
                  className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className={`w-14 h-14 rounded-2xl border ${pt.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                    <pt.icon className={`w-7 h-7 ${pt.color}`} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">{pt.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ WHY PARTNER WITH US ═══════════ */}
        <section className="py-20 sm:py-24 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#e77817] bg-[#e77817]/10 border border-[#e77817]/20 px-4 py-1.5 rounded-full mb-4">
                PARTNER BENEFITS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                Built to Help You Succeed
              </h2>
              <p className="text-base text-slate-500 leading-relaxed">
                Our partnership isn't just about referrals — it's about building a long-term, mutually rewarding relationship with tools, support, and incentives that actually work.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <div
                  key={i}
                  className="bg-[#fafbfc] rounded-2xl border border-slate-200/80 p-6 hover:bg-white hover:shadow-md hover:border-slate-300 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#28166f] to-[#3a1f9e] flex items-center justify-center mb-4 shadow-md shadow-[#28166f]/20 group-hover:scale-110 transition-transform duration-200">
                    <b.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-1.5">{b.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS STEPS ═══════════ */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1a0e4f] via-[#28166f] to-[#1c1050] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#e77817]/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Get Started in 3 Simple Steps
              </h2>
              <p className="text-base text-slate-300 max-w-2xl mx-auto">
                From application to earning — the entire process is streamlined and hassle-free.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                { step: "01", title: "Apply", desc: "Fill out the partner form below with your details. It takes less than 2 minutes.", icon: Zap },
                { step: "02", title: "Get Approved", desc: "Our team reviews your application and onboards you within 24–48 hours.", icon: Shield },
                { step: "03", title: "Start Earning", desc: "Share your referral link, close deals, and watch your recurring revenue grow.", icon: TrendingUp },
              ].map((s, i) => (
                <div key={i} className="relative text-center p-6 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm">
                  <div className="text-5xl font-black text-[#e77817]/25 absolute top-3 right-5 select-none">{s.step}</div>
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e77817] flex items-center justify-center mb-5 shadow-lg shadow-[#e77817]/30">
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-xl font-black text-white mb-2">{s.title}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ PARTNER FORM SECTION ═══════════ */}
        <section id="partner-form" className="py-20 sm:py-24 bg-[#fafbfc] border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-start">

              {/* Left Column: Content (3/5) */}
              <div className="lg:col-span-2 lg:sticky lg:top-28">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#28166f] bg-[#28166f]/10 border border-[#28166f]/20 px-4 py-1.5 rounded-full mb-4">
                  BECOME A PARTNER
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
                  Let's Build Something{" "}
                  <span className="text-[#e77817]">Great Together</span>
                </h2>
                <p className="text-base text-slate-500 leading-relaxed mb-8">
                  Whether you're an independent consultant, a growing agency, or a chartered accountant managing multiple businesses — our partnership program is designed for you. Share your details and our team will reach out within 24 hours.
                </p>

                {/* Why partner bullets */}
                <div className="space-y-4 mb-8">
                  {[
                    "Zero joining fee — completely free to start",
                    "Earn recurring revenue, not one-time payouts",
                    "Dedicated partner manager for your account",
                    "Access to co-branded marketing materials",
                    "Priority support for your clients",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial quote */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 italic leading-relaxed mb-3">
                    "Partnering with Assay Biz has been a game-changer for our CA practice. We onboarded 15 clients in 2 months and the recurring commission model means steady income."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#28166f] to-[#e77817] flex items-center justify-center text-white text-xs font-bold">
                      RK
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Rajesh Kumar</div>
                      <div className="text-xs text-slate-500">CA Partner, Delhi</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Form (2/5) */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#28166f] to-[#3a1f9e] flex items-center justify-center shadow-md shadow-[#28166f]/20">
                      <Handshake className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Partner Application</h3>
                      <p className="text-xs text-slate-500">Fill the form below and we'll get back within 24 hrs</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          required
                          placeholder="e.g. Rajesh Kumar"
                          className="pl-11 h-12 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Email Address *</label>
                        <div className="relative">
                          <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <Input
                            type="email"
                            required
                            placeholder="you@company.com"
                            className="pl-11 h-12 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-2">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <Input
                            type="tel"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile"
                            className="pl-11 h-12 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                            value={formData.mobile}
                            onChange={e => setFormData({...formData, mobile: e.target.value.replace(/\D/g, '')})}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Company / Agency Name</label>
                      <div className="relative">
                        <Building className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          placeholder="e.g. Kumar & Associates"
                          className="pl-11 h-12 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                          value={formData.company}
                          onChange={e => setFormData({...formData, company: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Your Message / Proposal *</label>
                      <Textarea
                        required
                        placeholder="Tell us about your business, how many clients you manage, and how you'd like to collaborate with Assay Biz..."
                        className="min-h-[120px] resize-none rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-13 bg-[#e77817] hover:bg-[#d46a0f] text-white font-bold text-base rounded-xl shadow-lg shadow-[#e77817]/25 transition-all duration-300 hover:scale-[1.01]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Submitting...
                        </span>
                      ) : (
                        <>Submit Partnership Request <ArrowRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>

                    <p className="text-xs text-slate-400 text-center leading-relaxed">
                      By submitting, you agree to our Terms of Service. We'll never share your information with third parties.
                    </p>
                  </form>
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
