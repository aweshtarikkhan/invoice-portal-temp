import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Mail, Phone, User, Clock,
  Sparkles, Zap, ShieldCheck,
  Send, Facebook, Instagram, Youtube,
} from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { usePlatformSocials, formatSocialUrl } from "@/hooks/use-platform-socials";

export default function ContactUsPage() {
  const { toast } = useToast();
  const { socials } = usePlatformSocials();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    subject: "Product Demo & Pricing",
    message: "",
  });

  const rawPhone = socials?.phone ? socials.phone.replace(/[^0-9]/g, "") : "917806025875";
  const displayPhone = socials?.phone || "+91 7806025875";
  const displayEmail = "support@aassaybiz.com";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile)) {
      toast({ title: "Invalid Mobile", description: "Please enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        subject: formData.subject,
        message: formData.message,
      };

      const { error } = await supabase.from("feature_requests").insert({
        feature_name: "Contact Us Inquiry",
        request_type: "demo_request",
        user_email: formData.email,
        message: JSON.stringify({ ...payload, is_contact_inquiry: true }),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. Our support team will get in touch with you shortly",
        variant: "default",
      });

      setFormData({
        name: "",
        email: "",
        mobile: "",
        subject: "Product Demo & Pricing",
        message: "",
      });
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 justify-between overflow-x-hidden">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl mx-auto rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-xl bg-white grid lg:grid-cols-12 items-stretch">

          {/* Left Column — Form Section (Increased Height & Spacious, lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-center p-6 sm:p-7 lg:p-9 bg-[#fafbfc]">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#28166f] to-[#e77817] flex items-center justify-center shadow-md shadow-[#28166f]/20 shrink-0">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">Send Us a Message</h3>
                  <p className="text-xs text-slate-500">Fill in the form below and our team will get back to you shortly</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                {/* Row 1: Full Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        placeholder="e.g. Rajesh Kumar"
                        className="pl-9 h-10 sm:h-11 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white shadow-2xs"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                        className="pl-9 h-10 sm:h-11 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white shadow-2xs"
                        value={formData.mobile}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Email & Topic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="pl-9 h-10 sm:h-11 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white shadow-2xs"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Inquiry Topic *</label>
                    <Select
                      value={formData.subject}
                      onValueChange={(val) => setFormData({ ...formData, subject: val })}
                    >
                      <SelectTrigger className="h-10 sm:h-11 rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm bg-white shadow-2xs">
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Product Demo & Pricing">Product Demo & Pricing</SelectItem>
                        <SelectItem value="Technical & App Support">Technical & App Support</SelectItem>
                        <SelectItem value="GST & E-Invoicing Query">GST & E-Invoicing Query</SelectItem>
                        <SelectItem value="Enterprise & Custom Setup">Enterprise & Custom Setup</SelectItem>
                        <SelectItem value="Partnership & Reseller">Partnership & Reseller</SelectItem>
                        <SelectItem value="General Question">General Question</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Your Message with expanded comfortable height */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Your Message *</label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Tell us how we can help your business operations..."
                    className="min-h-[105px] sm:min-h-[115px] resize-none rounded-xl border-slate-200 focus:border-[#28166f] focus:ring-[#28166f]/20 text-xs sm:text-sm py-2.5 bg-white shadow-2xs"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 sm:h-12 bg-[#e77817] hover:bg-[#d46a0f] text-white font-bold text-sm rounded-xl shadow-md shadow-[#e77817]/25 transition-all duration-300 hover:scale-[1.005]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Sending Message...
                    </span>
                  ) : (
                    <>Send Message <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  By submitting, you agree to our Terms of Service. Your data is 100% encrypted & confidential
                </p>
              </form>
            </div>
          </div>

          {/* Right Column — Info Section (Compact & Sleek Height, lg:col-span-5) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#1a0e4f] via-[#28166f] to-[#1c1050] p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden text-white">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#e77817]/15 rounded-full blur-[70px] -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#28166f]/60 rounded-full blur-[70px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1.5 leading-snug">
                We're Here to <span className="text-[#e77817]">Help</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Have questions about billing, custom plans, or need live onboarding? Our product specialists are ready to help
              </p>

              {/* Compact Direct Contact Cards */}
              <div className="space-y-2 mb-4">
                {/* Phone & WhatsApp */}
                <a
                  href={`tel:${rawPhone}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#e77817]/20 border border-[#e77817]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4 text-[#ffaa47]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-300 font-medium">Direct Phone & WhatsApp</div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{displayPhone}</div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${displayEmail}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4 text-sky-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-300 font-medium">Support Email</div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{displayEmail}</div>
                  </div>
                </a>

                {/* Working Hours */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.08] border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] text-slate-300 font-medium">Support Hours</div>
                    <div className="text-xs font-bold text-white">Mon – Sat: 9:00 AM – 7:30 PM IST</div>
                  </div>
                </div>
              </div>

              {/* Creative 2-Column Stats Summary (Compact) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-2.5 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ffaa47] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[#ffaa47] leading-tight">Quick Response</span>
                </div>
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl border border-white/10 p-2.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-emerald-400 leading-tight">99.8% Resolution</span>
                </div>
              </div>
            </div>

            {/* Social Connect Icons in Info Footer */}
            <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium">Official Socials:</span>
              <div className="flex items-center gap-2">
                <a
                  href={formatSocialUrl("youtube", socials?.youtube) || "https://www.youtube.com/@assaybiz"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#e77817] flex items-center justify-center transition-colors text-white"
                  title="YouTube"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href={formatSocialUrl("facebook", socials?.facebook) || "https://www.facebook.com/assaybiz"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#e77817] flex items-center justify-center transition-colors text-white"
                  title="Facebook"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href={formatSocialUrl("instagram", socials?.instagram) || "https://www.instagram.com/assaybiz"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#e77817] flex items-center justify-center transition-colors text-white"
                  title="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
