import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  CheckCircle2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface BookDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookDemoDialog({ open, onOpenChange }: BookDemoDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    company: "",
    city: "",
    industry: "Retail & Wholesale",
    preferred_time: "Morning (10:00 AM - 1:00 PM)",
    message: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      mobile: "",
      email: "",
      company: "",
      city: "",
      industry: "Retail & Wholesale",
      preferred_time: "Morning (10:00 AM - 1:00 PM)",
      message: "",
    });
    setSubmitted(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setTimeout(() => {
        resetForm();
      }, 300);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid work or personal email.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.company.trim()) {
      toast({
        title: "Company Required",
        description: "Please enter your business or company name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        mobile: cleanMobile,
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
        city: formData.city.trim() || "Not specified",
        industry: formData.industry,
        preferred_time: formData.preferred_time,
        message: formData.message.trim() || "Standard product walkthrough requested",
      };

      const { error } = await supabase.from("feature_requests").insert({
        feature_name: "Book a Free Demo",
        request_type: "demo_request",
        user_email: formData.email.trim().toLowerCase(),
        message: JSON.stringify(payload),
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Demo Request Submitted!",
        description: "Our product specialist will reach out to you shortly.",
        variant: "default",
      });
    } catch (err: any) {
      console.error("Demo submission error:", err);
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit demo request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-white border-slate-200 shadow-2xl z-[9999]">
        {submitted ? (
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Demo Request Confirmed!
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-slate-900">{formData.name}</span>!
                Our product expert will connect with you on{" "}
                <span className="font-semibold text-indigo-600">+91 {formData.mobile}</span> during{" "}
                <span className="font-semibold text-slate-900">{formData.preferred_time}</span> for a personalized live walkthrough.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Business:</span>
                <span className="font-semibold text-slate-800">{formData.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Industry:</span>
                <span className="font-semibold text-slate-800">{formData.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Slot:</span>
                <span className="font-semibold text-indigo-700">{formData.preferred_time}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={resetForm}
              >
                Book Another Demo
              </Button>
              <Button
                className="w-full rounded-xl bg-[#28166f] hover:bg-[#e77817] text-white shadow-md shadow-[#28166f]/20 hover:shadow-orange-500/30 transition-all duration-300"
                onClick={() => handleClose(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Modal Header matching logo colors */}
            <div className="bg-gradient-to-br from-[#28166f] via-[#1f1157] to-[#120b33] p-6 sm:p-7 text-white relative overflow-hidden rounded-t-2xl">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#e77817]/20 rounded-full blur-2xl" />
              <div className="relative z-10 space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e77817]/20 border border-[#e77817]/40 text-orange-200 text-xs font-semibold backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#e77817]" /> Free 1-on-1 Interactive Demo
                </div>
                <DialogTitle className="text-2xl sm:text-2xl font-black tracking-tight text-white">
                  Experience Assay Biz in Action
                </DialogTitle>
                <DialogDescription className="text-orange-100/90 text-xs sm:text-sm">
                  Get a personalized walkthrough tailored to your business workflow with our product specialist.
                </DialogDescription>
              </div>

              {/* Quick Perks Pill */}
              <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap gap-3 text-[11px] text-orange-200/90">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#e77817]" /> 15-Minute Tailored Session
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> No Credit Card & No Obligation
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="demo-name" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="demo-name"
                    placeholder="e.g. Rajesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Mobile / WhatsApp */}
                <div className="space-y-1.5">
                  <Label htmlFor="demo-mobile" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile / WhatsApp <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      +91
                    </span>
                    <Input
                      id="demo-mobile"
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                      required
                      className="h-10 pl-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="demo-email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Work / Personal Email <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="demo-email"
                    type="email"
                    placeholder="rajesh@mycompany.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="demo-company" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> Business / Company Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="demo-company"
                    placeholder="e.g. Kumar Traders Pvt Ltd"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    required
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* City & State */}
                <div className="space-y-1.5">
                  <Label htmlFor="demo-city" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> City & State
                  </Label>
                  <Input
                    id="demo-city"
                    placeholder="e.g. Indore, Madhya Pradesh"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-10 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <Label htmlFor="demo-industry" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Business Category
                  </Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(val) => setFormData({ ...formData, industry: val })}
                  >
                    <SelectTrigger id="demo-industry" className="h-10 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="Retail & Wholesale">Retail & Wholesale</SelectItem>
                      <SelectItem value="Manufacturing & Production">Manufacturing & Production</SelectItem>
                      <SelectItem value="Services & Consulting">Services & Consulting</SelectItem>
                      <SelectItem value="Pharma & Healthcare">Pharma & Healthcare</SelectItem>
                      <SelectItem value="Technology & IT Agency">Technology & IT Agency</SelectItem>
                      <SelectItem value="Construction & Real Estate">Construction & Real Estate</SelectItem>
                      <SelectItem value="Logistics & Transport">Logistics & Transport</SelectItem>
                      <SelectItem value="Other">Other Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preferred Slot */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="demo-slot" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Preferred Demo Time Slot
                </Label>
                <Select
                  value={formData.preferred_time}
                  onValueChange={(val) => setFormData({ ...formData, preferred_time: val })}
                >
                  <SelectTrigger id="demo-slot" className="h-10 rounded-xl border-slate-200">
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="Morning (10:00 AM - 1:00 PM)">Morning (10:00 AM - 1:00 PM)</SelectItem>
                    <SelectItem value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</SelectItem>
                    <SelectItem value="Evening (5:00 PM - 8:00 PM)">Evening (5:00 PM - 8:00 PM)</SelectItem>
                    <SelectItem value="Instant / Connect Today ASAP">Instant / Connect Today ASAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specific Requirements / Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="demo-message" className="text-xs font-semibold text-slate-700">
                  What features are you most interested in? <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="demo-message"
                  rows={2}
                  placeholder="e.g. GST Invoicing, WhatsApp invoice dispatch, Employee attendance, Multi-branch stock..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm resize-none"
                />
              </div>

              {/* Submit Actions */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-bold bg-[#28166f] hover:bg-[#e77817] text-white rounded-xl shadow-lg shadow-[#28166f]/25 hover:shadow-orange-500/30 transition-all duration-300 hover:scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 text-orange-200" /> Book My Free Demo
                    </>
                  )}
                </Button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  🔒 We respect your privacy. No spam. You will only receive your demo coordination call/WhatsApp.
                </p>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
