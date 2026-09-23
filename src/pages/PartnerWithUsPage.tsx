import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Handshake, Mail, Phone, User,
  IndianRupee, Users, TrendingUp, Star, MapPin,
} from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { AassayBizBrand } from "@/components/shared/AassayBizBrand";

const STATS = [
  { value: "Attractive", label: "Commission", icon: IndianRupee, color: "text-emerald-400" },
  { value: "100+", label: "Active Partners", icon: Users, color: "text-[#ff9438]" },
  { value: "₹23 Cr+", label: "Invoiced by Partners", icon: TrendingUp, color: "text-sky-400" },
  { value: "4.8 ★", label: "Partner Satisfaction", icon: Star, color: "text-amber-400" },
];

export default function PartnerWithUsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    email: "",
    mobile: "",
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
        city: formData.city,
        mobile: formData.mobile,
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

      setFormData({ name: "", city: "", email: "", mobile: "", message: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-50/50 justify-between overflow-x-hidden">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-6xl mx-auto rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl bg-white grid lg:grid-cols-5 items-stretch">

          {/* Left Column — Dark Blue Gradient */}
          <div className="lg:col-span-2 bg-gradient-to-b from-[#1a0e4f] via-[#28166f] to-[#1c1050] p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e77817]/10 rounded-full blur-[70px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#28166f]/60 rounded-full blur-[70px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#ffaa47] bg-[#e77817]/20 border border-[#e77817]/30 px-3 py-1 rounded-full mb-3">
                BECOME A PARTNER
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 leading-tight">
                Let's Build Something{" "}
                <span className="text-[#e77817]">Great Together</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Whether you're an independent consultant, a growing agency, or a chartered accountant managing multiple businesses — our partnership program is designed for you. Share your details and our team will reach out within 24 hours.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {STATS.map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.08] backdrop-blur-sm rounded-xl border border-white/10 p-3.5 flex flex-col gap-0.5 hover:bg-white/[0.13] transition-colors duration-200"
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color} mb-0.5`} />
                    <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    <div className="text-[11px] text-slate-300 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-3 flex items-center justify-center p-6 sm:p-8 bg-[#fafbfc]">
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#28166f] to-[#3a1f9e] flex items-center justify-center shadow-md shadow-[#28166f]/20 shrink-0">
                  <Handshake className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Partner Application</h3>
                  <p className="text-xs text-slate-500">Fill the form below and we'll get back within 24 hrs</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Row 1: Full Name & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        placeholder="e.g. Rajesh Kumar"
                        className="pl-9 h-10 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">City *</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        placeholder="e.g. Mumbai"
                        className="pl-9 h-10 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="pl-9 h-10 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile"
                        className="pl-9 h-10 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white"
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Your Message */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Message *</label>
                  <Textarea
                    required
                    rows={3}
                    placeholder="Tell us about your business, how many clients you manage, and how you'd like to collaborate with Aassay Biz..."
                    className="min-h-[72px] resize-none rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm py-2 bg-white"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#e77817] hover:bg-[#d46a0f] text-white font-bold text-sm rounded-xl shadow-md shadow-[#e77817]/25 transition-all duration-300 hover:scale-[1.005]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Submitting...
                    </span>
                  ) : (
                    <>Submit Partnership Request <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  By submitting, you agree to our Terms of Service. We'll never share your information with third parties.
                </p>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Sleek single-line bottom footer */}
      <footer className="py-2.5 px-4 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white shrink-0">
        <span>© {new Date().getFullYear()} <AassayBizBrand />. All rights reserved.</span>
        <span className="mx-2 text-slate-300">•</span>
        <Link to="/terms" className="hover:underline text-slate-600">Terms</Link>
        <span className="mx-1.5 text-slate-300">•</span>
        <Link to="/privacy" className="hover:underline text-slate-600">Privacy</Link>
        <span className="mx-1.5 text-slate-300">•</span>
        <Link to="/support" className="hover:underline text-slate-600">Support</Link>
      </footer>
    </div>
  );
}
