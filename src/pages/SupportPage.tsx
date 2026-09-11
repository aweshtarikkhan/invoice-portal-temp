import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Send,
  Headphones,
  ShieldCheck,
  FileQuestion,
  PhoneCall,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useAppStore } from '@/store/app-store';
import { supabase } from '@/integrations/supabase/client';

export default function SupportPage() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const org = useAppStore((s) => s.organization);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '',
    email: user?.email || '',
    phone: '',
    category: 'general',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: 'Copied to clipboard!',
      description: `${label} (${text}) copied.`,
    });
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleWhatsAppDirect = (customMsg?: string) => {
    const text = encodeURIComponent(
      customMsg ||
        `Hello Assay Biz Support Team,\n\nI need assistance with my account.\nBusiness: ${org?.name || 'N/A'}\nEmail: ${user?.email || 'N/A'}`
    );
    window.open(`https://wa.me/919424825919?text=${text}`, '_blank');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.phone)) {
      toast({ title: "Invalid Mobile", description: "Please enter a valid 10-digit mobile number.", variant: "destructive" });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a subject and details for your query.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const payload = {
        name: formData.name || 'N/A',
        email: formData.email || user?.email || 'N/A',
        phone: (formData as any).phone || 'N/A',
        business: org?.name || 'N/A',
        category: formData.category,
        subject: formData.subject,
        message: formData.message,
      };

      const { error } = await supabase.from('feature_requests').insert({
        feature_name: 'Help & Support',
        request_type: 'support_request',
        user_email: payload.email,
        message: JSON.stringify(payload),
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: 'Request sent successfully',
        description: 'Our support team has received your query and will respond soon.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'general',
        subject: '',
        message: '',
      } as any);
    } catch (err: any) {
      toast({
        title: 'Error submitting request',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormWhatsApp = () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter at least a subject and message before sending.',
        variant: 'destructive',
      });
      return;
    }

    const text =
      `*Assay Biz Support Request*\n\n` +
      `*Category:* ${formData.category}\n` +
      `*Name:* ${formData.name || 'User'}\n` +
      `*Email:* ${formData.email || user?.email || 'N/A'}\n` +
      `*Business:* ${org?.name || 'N/A'}\n` +
      `*Subject:* ${formData.subject}\n\n` +
      `*Details:*\n${formData.message}`;

    handleWhatsAppDirect(text);
  };

  const faqs = [
    {
      q: 'How do I upgrade or change my subscription plan?',
      a: 'You can upgrade your plan at any time by clicking the "Upgrade Plan" button in the top navigation bar or sidebar, or by navigating to Admin Panel -> Subscription & Billing. All plan changes take effect immediately.',
    },
    {
      q: 'Can I customize invoice templates with my company logo and signature?',
      a: 'Yes! Go to Settings -> Templates in the sidebar. You can choose from multiple GST compliant templates, customize primary brand colors, upload your company logo, and configure terms & conditions.',
    },
    {
      q: 'How do I add team members and assign roles?',
      a: 'Navigate to Admin Panel -> Team Members. You can invite colleagues with roles such as Admin, Manager, or Staff, and configure granular permissions per module (e.g. Sales, Purchases, Banking, HR).',
    },
    {
      q: 'Is my business data secure and backed up?',
      a: 'All data is encrypted in transit and at rest using enterprise-grade AES-256 encryption. Automated daily database snapshots and automated backups ensure your records are always safe.',
    },
    {
      q: 'How do I report GST returns from Assay Biz?',
      a: 'Go to Reports -> GST Returns. You can generate and export GSTR-1, GSTR-2, and GSTR-3B summary reports in JSON and Excel formats ready for upload to the GST portal.',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-xl">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Headphones className="w-80 h-80" />
        </div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-medium text-blue-100 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" /> Dedicated Support Desk
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How can we help you today?
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Our dedicated customer support and technical assistance team is available to assist you with invoices, payments, staff HR, and platform setup.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-blue-200">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-white">Support Team Active</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Mon – Sat: 9:30 AM – 7:00 PM IST
            </div>
          </div>
        </div>
      </div>

      {/* Primary Contact Channels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Phone */}
        <Card className="border-border shadow-sm hover:shadow-md transition-all hover:border-blue-500/40 bg-card group">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <PhoneCall className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              Phone Support
              <Badge variant="secondary" className="text-[11px] font-normal">Voice</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Talk directly with our product specialist team for urgent assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="p-3 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Direct Helpline</span>
                <span className="text-base font-bold text-foreground">+91 94065 45047</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('+919406545047', 'Phone Number', 'phone')}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                title="Copy Phone Number"
              >
                {copiedKey === 'phone' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <a
              href="tel:+919406545047"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-colors shadow-sm"
            >
              <Phone className="w-4 h-4" /> Call Now
            </a>
            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> 9:30 AM – 7:00 PM IST
            </p>
          </CardContent>
        </Card>

        {/* Card 2: WhatsApp */}
        <Card className="border-border shadow-sm hover:shadow-md transition-all hover:border-emerald-500/40 bg-card group">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              WhatsApp Chat
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-normal">
                Instant
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Quick answers, screenshots sharing, and guided configuration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="p-3 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Business WhatsApp</span>
                <span className="text-base font-bold text-foreground">+91 94248 25919</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('+919424825919', 'WhatsApp Number', 'whatsapp')}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                title="Copy WhatsApp Number"
              >
                {copiedKey === 'whatsapp' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <button
              onClick={() => handleWhatsAppDirect()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 transition-colors shadow-sm cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" /> Chat on WhatsApp <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Fastest response (usually &lt; 10 min)
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Email */}
        <Card className="border-border shadow-sm hover:shadow-md transition-all hover:border-violet-500/40 bg-card group">
          <CardHeader className="pb-3">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              Email Support
              <Badge variant="secondary" className="text-[11px] font-normal">Official</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Send detailed technical queries, logs, invoices, or billing queries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="p-3 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] text-muted-foreground">Support Email</span>
                <span className="text-base font-bold text-foreground truncate max-w-[170px] sm:max-w-[190px]">support@assaybiz.com</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('support@assaybiz.com', 'Support Email', 'email')}
                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                title="Copy Email Address"
              >
                {copiedKey === 'email' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <a
              href="mailto:support@assaybiz.com?subject=Support%20Request%20-%20Assay%20Biz"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold py-2.5 transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4" /> Send Email
            </a>
            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Written reply within 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Support Form & Office Information */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Support Inquiry Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border-border shadow-sm bg-card h-full flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-500" /> Send Us a Message
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Fill in the form below to quickly route your query to the right specialist.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email ID *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@business.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile No. *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit Mobile No." required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Issue Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="invoicing">Invoicing & GST Reports</SelectItem>
                        <SelectItem value="inventory">Inventory & Stock</SelectItem>
                        <SelectItem value="billing">Subscription & Plan Upgrade</SelectItem>
                        <SelectItem value="hr">Business HR & Attendance</SelectItem>
                        <SelectItem value="bug">Bug / Technical Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary of your query"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message">Detailed Description *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe what you need assistance with, including any error messages or specific requirements..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6"
                  >
                    <Send className="w-4 h-4 mr-2" /> {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Corporate Legal & Office Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border shadow-sm bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Building2 className="w-4 h-4" /> Company & Headquarters
              </div>
              <CardTitle className="text-lg font-bold">Emerging Thoughts Pvt. Ltd.</CardTitle>
              <CardDescription className="text-xs">
                Operator & Parent Entity of Assay Biz Enterprise Platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Corporate Identity Number (CIN)</div>
                  <div className="font-mono font-semibold text-foreground select-all text-xs sm:text-sm mt-0.5">
                    U73200MP2025PTC074472
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">Registered Corporate Office</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Flat No. 501, T-4 Sagar Lekh View Home,<br />
                      Bhopal, Madhya Pradesh, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                  <Building2 className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">Branch & Operations Center</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      E-9 Govindpura Industrial Area,<br />
                      Bhopal, Madhya Pradesh - 462023, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">Operating & Support Hours</span>
                    <p className="text-xs text-muted-foreground">
                      Monday to Saturday: 09:30 AM – 07:00 PM IST<br />
                      <span className="text-[11px] text-muted-foreground/80">Sunday & National Holidays: Closed</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Helpdesk Summary Card */}
          <Card className="border-border shadow-sm bg-muted/30 border-dashed">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Quick Support Checklist</h4>
                  <p className="text-[11px] text-muted-foreground">Have your registered email and business name ready.</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">24/7 SLA</Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Section */}
      <Card className="border-border shadow-sm bg-card">
        <CardHeader>
          <div className="flex items-center gap-2 text-indigo-500 font-semibold text-sm">
            <FileQuestion className="w-4 h-4" /> Help Center
          </div>
          <CardTitle className="text-xl font-bold">Frequently Asked Questions</CardTitle>
          <CardDescription>
            Quick answers to common questions about billing, templates, user accounts, and features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/60">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 text-left py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
