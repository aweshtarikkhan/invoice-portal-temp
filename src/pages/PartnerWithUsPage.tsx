import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Handshake, Mail, Phone, User, Building } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Left Side: Info */}
        <div className="bg-gradient-to-br from-[#0a192f] to-[#112240] p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Handshake className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-3xl font-black mb-4">Partner With Us</h2>
            <p className="text-slate-300 leading-relaxed mb-8">
              Join forces with Aassay BiZ. We are always looking for dynamic partners, resellers, and agencies to grow together. Provide your details and let's build something great.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-center text-slate-300">
                <CheckIcon className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
                Exclusive Partner Benefits
              </li>
              <li className="flex items-center text-slate-300">
                <CheckIcon className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
                Dedicated Support Team
              </li>
              <li className="flex items-center text-slate-300">
                <CheckIcon className="w-5 h-5 text-emerald-400 mr-3 shrink-0" />
                Revenue Sharing & Margins
              </li>
            </ul>
          </div>
          
          <div className="mt-12 text-sm text-slate-400">
            © 2026 Aassay BiZ Platform
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10">
          <h3 className="text-2xl font-bold text-[#0a192f] mb-6">Submit your details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input required placeholder="John Doe" className="pl-10 h-11" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input type="email" required placeholder="john@example.com" className="pl-10 h-11" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input required placeholder="+91 9876543210" className="pl-10 h-11" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Company / Agency Name</label>
              <div className="relative">
                <Building className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input placeholder="Tech Solutions Inc." className="pl-10 h-11" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Message / Proposal</label>
              <Textarea required placeholder="Tell us how we can collaborate..." className="min-h-[100px] resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-bold mt-2">
              {loading ? "Submitting..." : (
                <>Submit Request <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}

function CheckIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
