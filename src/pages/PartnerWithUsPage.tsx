import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Handshake, Mail, Phone, User,
  IndianRupee, Users, TrendingUp, Star,
} from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const INVEST_OPTIONS = [
  "Up to ₹5,000",
  "Up to ₹10,000",
  "Up to ₹25,000",
  "Up to ₹50,000",
  "Up to ₹1,00,000",
  "More than ₹1 Lac",
];

const STATS = [
  { value: "Up to 30%", label: "Recurring Commission", icon: IndianRupee, color: "text-emerald-500" },
  { value: "100+", label: "Active Partners", icon: Users, color: "text-[#28166f]" },
  { value: "₹23 Cr+", label: "Invoiced by Partners", icon: TrendingUp, color: "text-blue-500" },
  { value: "4.8 ★", label: "Partner Satisfaction", icon: Star, color: "text-amber-500" },
];

export default function PartnerWithUsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    invest: "",
    message: "",
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
        ready_to_invest: formData.invest,
        message: formData.message,
      };

      const { error } = await supabase.from("feature_requests").insert({
        feature_name: "Partner With Us",
        request_type: "partner_request",
        user_email: formData.email,
        message: JSON.stringify(payload),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Request Submitted!",
        description: "Thank you for showing interest. Our team will contact you shortly.",
        variant: "default",
      });

      setFormData({ name: "", email: "", mobile: "", invest: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicHeader />
      <main className="flex-grow">

        {/* ═══════════ PARTNER FORM SECTION (ONLY SECTION) ═══════════ */}
        <section id="partner-form" className="bg-white mb-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-5 items-stretch">

              {/* Left Column — Dark Blue */}
              <div className="lg:col-span-2 bg-gradient-to-b from-[#1a0e4f] via-[#28166f] to-[#1c1050] px-8 sm:px-10 py-12 flex flex-col justify-center relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#e77817]/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#28166f]/60 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                <div className="relative z-10">
                  <span className="inline-block text-xs font-bold uppercase tracking-widest text-[#ffaa47] bg-[#e77817]/20 border border-[#e77817]/30 px-4 py-1.5 rounded-full mb-6">
                    BECOME A PARTNER
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                    Let's Build Something{" "}
                    <span className="text-[#e77817]">Great Together</span>
                  </h2>
                  <p className="text-base text-slate-300 leading-relaxed mb-10">
                    Whether you're an independent consultant, a growing agency, or a chartered accountant managing multiple businesses — our partnership program is designed for you. Share your details and our team will reach out within 24 hours.
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    {STATS.map((stat, i) => (
                      <div
                        key={i}
                        className="bg-white/[0.08] backdrop-blur-sm rounded-2xl border border-white/10 p-4 flex flex-col gap-1 hover:bg-white/[0.13] transition-colors duration-200"
                      >
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-1`} />
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <div className="bg-white/[0.07] backdrop-blur-sm rounded-2xl border border-white/10 p-5">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-slate-300 italic leading-relaxed mb-3">
                      "Partnering with Assay Biz has been a game-changer for our CA practice. We onboarded 15 clients in 2 months and the recurring commission model means steady income."
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e77817] to-[#ff9438] flex items-center justify-center text-white text-xs font-bold">
                        RK
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Rajesh Kumar</div>
                        <div className="text-xs text-slate-400">CA Partner, Delhi</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-3 flex items-center justify-center px-6 sm:px-12 py-16 bg-[#fafbfc]">
                <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-10">
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
                    {/* Full Name */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                          required
                          placeholder="e.g. Rajesh Kumar"
                          className="pl-11 h-12 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Email + Mobile */}
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
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                            onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ready to Invest Dropdown */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Ready to Invest *</label>
                      <div className="relative">
                        <IndianRupee className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                        <select
                          required
                          className="w-full pl-11 pr-4 h-12 rounded-xl border border-slate-200 bg-white focus:border-[#28166f] focus:ring-2 focus:ring-[#28166f]/20 text-sm text-slate-700 appearance-none outline-none transition"
                          value={formData.invest}
                          onChange={e => setFormData({ ...formData, invest: e.target.value })}
                        >
                          <option value="" disabled>Select investment range</option>
                          {INVEST_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <svg className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Your Message / Proposal *</label>
                      <Textarea
                        required
                        placeholder="Tell us about your business, how many clients you manage, and how you'd like to collaborate with Assay Biz..."
                        className="min-h-[120px] resize-none rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-sm"
                        value={formData.message}
                        onChange={e => setFormData({ ...formData, message: e.target.value })}
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
