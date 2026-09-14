import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/shared/SEO";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
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
  ArrowRight,
  Clock,
  Laptop,
  MessageSquare,
} from "lucide-react";

export default function DemoAutoLoginPage() {
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
    <>
      <SEO
        title="Book a Free Demo - Assay Biz"
        description="Schedule a free 1-on-1 personalized product demo of Assay Biz. Learn how to streamline your billing, inventory, and staff management."
        path="/demo"
      />
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <PublicHeader />

        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Top Breadcrumb & Badge */}
            <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Free 1-on-1 Personalized Session
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                See How Assay Biz Transforms Your Business
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Connect with our product specialists for a live interactive demo tailored to your exact industry workflows.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Demo Value Props & Highlights */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    What you will get in this 15-min demo:
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Complete Feature Walkthrough</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          GST Invoicing, instant WhatsApp dispatch, live stock tracking, and employee attendance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Tailored to Your Industry</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Whether Retail, Manufacturing, Services, or Distribution, we demonstrate real-world setup.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Direct Q&A with Product Expert</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Clear all questions about migration from Excel/Vyapar/Tally, multi-user permissions & pricing.
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-indigo-600" /> 15 Mins Quick Session
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> No Credit Card Required
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Free Trial Included
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Zap className="w-4 h-4 text-amber-600" /> Zero Commitment
                    </div>
                  </div>
                </div>

                {/* Direct Help Card */}
                <div className="p-5 rounded-2xl bg-indigo-900 text-white shadow-lg space-y-3">
                  <div className="text-xs uppercase font-bold text-indigo-300 tracking-wider">
                    Prefer Immediate Access?
                  </div>
                  <p className="text-sm text-indigo-100">
                    You can also create your free account immediately and start exploring right now.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-white text-indigo-900 hover:bg-indigo-50 border-0 font-bold rounded-xl"
                    asChild
                  >
                    <Link to="/register">
                      Create Free Account <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Demo Booking Form Card */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                  {submitted ? (
                    <div className="p-8 sm:p-12 text-center space-y-6">
                      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                          Demo Request Received!
                        </h3>
                        <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                          Thank you, <span className="font-semibold text-slate-900">{formData.name}</span>!
                          Our team will connect with you on{" "}
                          <span className="font-semibold text-indigo-600">+91 {formData.mobile}</span> during{" "}
                          <span className="font-semibold text-slate-900">{formData.preferred_time}</span>.
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs sm:text-sm text-slate-700 max-w-md mx-auto">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Business:</span>
                          <span className="font-semibold text-slate-900">{formData.company}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Email:</span>
                          <span className="font-semibold text-slate-900">{formData.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Industry:</span>
                          <span className="font-semibold text-slate-900">{formData.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Slot:</span>
                          <span className="font-semibold text-indigo-600">{formData.preferred_time}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto pt-2">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={resetForm}
                        >
                          Book Another Demo
                        </Button>
                        <Button
                          className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                          asChild
                        >
                          <Link to="/">Back to Home</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Card Header */}
                      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                          Fill Your Details to Schedule
                        </h2>
                        <p className="text-indigo-200/90 text-xs sm:text-sm mt-1">
                          Takes less than 1 minute. We will connect via Phone & WhatsApp at your chosen time.
                        </p>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Full Name */}
                          <div className="space-y-1.5">
                            <Label htmlFor="page-demo-name" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" /> Full Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              id="page-demo-name"
                              placeholder="Rajesh Kumar"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                              className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                          </div>

                          {/* Mobile */}
                          <div className="space-y-1.5">
                            <Label htmlFor="page-demo-mobile" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile / WhatsApp <span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                                +91
                              </span>
                              <Input
                                id="page-demo-mobile"
                                type="tel"
                                maxLength={10}
                                placeholder="9876543210"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })}
                                required
                                className="h-11 pl-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500 font-mono text-sm"
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div className="space-y-1.5">
                            <Label htmlFor="page-demo-email" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" /> Work / Personal Email <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              id="page-demo-email"
                              type="email"
                              placeholder="rajesh@company.com"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                              className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                          </div>

                          {/* Company Name */}
                          <div className="space-y-1.5">
                            <Label htmlFor="page-demo-company" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-slate-400" /> Business / Company Name <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                              id="page-demo-company"
                              placeholder="Kumar Traders Pvt Ltd"
                              value={formData.company}
                              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                              required
                              className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                          </div>

                          {/* City & State */}
                          <div className="space-y-1.5">
                            <Label htmlFor="page-demo-city" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> City & State
                            </Label>
                            <Input
                              id="page-demo-city"
                              placeholder="Indore, MP"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
                            />
                          </div>

                          {/* Industry */}
                          <div className="space-y-1.5">
                            <Label htmlFor="page-demo-industry" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Business Category
                            </Label>
                            <Select
                              value={formData.industry}
                              onValueChange={(val) => setFormData({ ...formData, industry: val })}
                            >
                              <SelectTrigger id="page-demo-industry" className="h-11 rounded-xl border-slate-200">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
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
                          <Label htmlFor="page-demo-slot" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Preferred Demo Time Slot
                          </Label>
                          <Select
                            value={formData.preferred_time}
                            onValueChange={(val) => setFormData({ ...formData, preferred_time: val })}
                          >
                            <SelectTrigger id="page-demo-slot" className="h-11 rounded-xl border-slate-200">
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Morning (10:00 AM - 1:00 PM)">Morning (10:00 AM - 1:00 PM)</SelectItem>
                              <SelectItem value="Afternoon (2:00 PM - 5:00 PM)">Afternoon (2:00 PM - 5:00 PM)</SelectItem>
                              <SelectItem value="Evening (5:00 PM - 8:00 PM)">Evening (5:00 PM - 8:00 PM)</SelectItem>
                              <SelectItem value="Instant / Connect Today ASAP">Instant / Connect Today ASAP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Specific Requirements / Notes */}
                        <div className="space-y-1.5">
                          <Label htmlFor="page-demo-message" className="text-xs font-semibold text-slate-700">
                            What are your key requirements? <span className="text-slate-400 font-normal">(Optional)</span>
                          </Label>
                          <Textarea
                            id="page-demo-message"
                            rows={3}
                            placeholder="e.g. GST Invoicing, WhatsApp invoice dispatch, Employee attendance, Multi-branch stock..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="rounded-xl border-slate-200 focus-visible:ring-indigo-500 text-sm resize-none"
                          />
                        </div>

                        {/* Submit Action */}
                        <div className="pt-3">
                          <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-13 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 hover:scale-[1.01]"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting Request...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 mr-2 text-indigo-200" /> Confirm & Book Free Demo
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-center text-slate-400 mt-2.5">
                            🔒 100% Free & No spam guarantee. We will reach out strictly for your demo session.
                          </p>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
