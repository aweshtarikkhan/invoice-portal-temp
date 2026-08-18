import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Globe, Server, CheckCircle2, AlertCircle, Copy, Send, HelpCircle, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function EmailSettingsTab() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [providerType, setProviderType] = useState<"default" | "resend_domain" | "smtp" | "gmail">("default");
  const [fromName, setFromName] = useState("Assay Biz");
  const [fromEmail, setFromEmail] = useState("no-reply@satahinvoice.com");

  // Resend Domain states
  const [domainName, setDomainName] = useState("");
  const [resendDomainId, setResendDomainId] = useState("");
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [domainStatus, setDomainStatus] = useState("pending");

  // SMTP states
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);

  // Test Email states
  const [testEmailOpen, setTestEmailOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isRegisteringDomain, setIsRegisteringDomain] = useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["org-email-settings", org?.id],
    queryFn: async () => {
      if (!org?.id) return null;
      const { data, error } = await supabase
        .from("organization_email_settings")
        .select("*")
        .eq("org_id", org.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!org?.id,
  });

  useEffect(() => {
    if (settings) {
      setProviderType(settings.provider_type as any || "default");
      setFromName(settings.from_name || org?.name || "Assay Biz");
      setFromEmail(settings.from_email || "no-reply@satahinvoice.com");
      
      setDomainName(settings.domain_name || "");
      setResendDomainId(settings.resend_domain_id || "");
      setDnsRecords(settings.dns_records || []);
      setDomainStatus(settings.domain_status || "pending");

      setSmtpHost(settings.smtp_host || "");
      setSmtpPort(settings.smtp_port || 587);
      setSmtpUser(settings.smtp_user || "");
      setSmtpPass(settings.smtp_pass || "");
      setSmtpSecure(settings.smtp_secure ?? false);
    } else if (org) {
      setFromName(org.name || "Assay Biz");
    }
  }, [settings, org]);

  // Handle Preset Selection for Gmail
  const applyGmailPreset = () => {
    setProviderType("gmail");
    setSmtpHost("smtp.gmail.com");
    setSmtpPort(587);
    setSmtpSecure(false);
    toast({
      title: "Gmail Preset Applied",
      description: "Enter your Gmail address and 16-character App Password.",
    });
  };

  // Save Settings
  const handleSave = async () => {
    if (!org?.id) return;
    setIsSaving(true);

    try {
      const payload: any = {
        org_id: org.id,
        provider_type: providerType,
        from_name: fromName,
        from_email: fromEmail,
        domain_name: domainName,
        resend_domain_id: resendDomainId,
        dns_records: dnsRecords,
        domain_status: domainStatus,
        smtp_host: smtpHost,
        smtp_port: Number(smtpPort),
        smtp_user: smtpUser,
        smtp_pass: smtpPass,
        smtp_secure: smtpSecure,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("organization_email_settings")
        .upsert(payload, { onConflict: "org_id" });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your email configuration has been updated.",
      });

      queryClient.invalidateQueries({ queryKey: ["org-email-settings"] });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Register Custom Domain via Edge Function
  const handleRegisterDomain = async () => {
    if (!domainName.trim() || !org?.id) {
      toast({ variant: "destructive", title: "Please enter a valid domain name" });
      return;
    }

    setIsRegisteringDomain(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-resend-domain", {
        body: {
          action: "create",
          domainName: domainName.trim(),
          orgId: org.id,
        },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);

      setResendDomainId(data.data.id);
      setDnsRecords(data.data.records || []);
      setDomainStatus(data.data.status || "pending");

      toast({
        title: "Domain Registered",
        description: "DNS records generated! Please add them to your domain provider.",
      });

      queryClient.invalidateQueries({ queryKey: ["org-email-settings"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Domain Registration Failed", description: err.message });
    } finally {
      setIsRegisteringDomain(false);
    }
  };

  // Verify Custom Domain
  const handleVerifyDomain = async () => {
    if (!resendDomainId || !org?.id) return;

    setIsVerifyingDomain(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-resend-domain", {
        body: {
          action: "get",
          domainId: resendDomainId,
          orgId: org.id,
        },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);

      setDomainStatus(data.status);
      setDnsRecords(data.data?.records || dnsRecords);

      if (data.status === "verified") {
        toast({
          title: "Domain Verified!",
          description: "Your custom domain is now verified and ready to send emails.",
        });
      } else {
        toast({
          title: "Verification Pending",
          description: "DNS changes can take a few minutes to propagate. Please check back shortly.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["org-email-settings"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: err.message });
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmailAddress.trim() || !org?.id) return;

    setIsSendingTest(true);
    try {
      // First auto-save settings so the edge function reads current choices
      await handleSave();

      const { data, error } = await supabase.functions.invoke("send-email-dispatcher", {
        body: {
          orgId: org.id,
          to: testEmailAddress.trim(),
          subject: "Test Email from Assay Biz",
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; rounded-lg;">
              <h2 style="color: #2563eb;">Test Email Successful! 🎉</h2>
              <p>Hello,</p>
              <p>This is a test email sent from your application using your configured email sending method (<strong>${providerType}</strong>).</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Sent at: ${new Date().toLocaleString()}</p>
            </div>
          `,
        },
      });

      if (error || data?.error) throw new Error(error?.message || data?.error);

      toast({
        title: "Test Email Sent!",
        description: `Successfully sent test email to ${testEmailAddress}.`,
      });

      setTestEmailOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Test Email Failed",
        description: err.message,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Email Sender Configuration
              </CardTitle>
              <CardDescription>
                Choose how outgoing emails (Invoices, Receipts, Custom Emails) are delivered to your clients.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setTestEmailOpen(true)} className="gap-2">
              <Send className="h-4 w-4" /> Send Test Email
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Sender Identity */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border">
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input 
                value={fromName} 
                onChange={(e) => setFromName(e.target.value)} 
                placeholder="e.g. Assay Biz Billing"
              />
              <p className="text-xs text-muted-foreground">The display name clients will see in their Inbox.</p>
            </div>
            <div className="space-y-2">
              <Label>Reply-To / From Email Address</Label>
              <Input 
                value={fromEmail} 
                onChange={(e) => setFromEmail(e.target.value)} 
                placeholder="e.g. billing@yourcompany.com"
              />
              <p className="text-xs text-muted-foreground">Email address used for sending / receiving replies.</p>
            </div>
          </div>

          {/* Provider Option Cards */}
          <RadioGroup 
            value={providerType} 
            onValueChange={(val: any) => setProviderType(val)}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Card 1: Default */}
            <div 
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                providerType === "default" 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setProviderType("default")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Mail className="h-4 w-4 text-blue-600" /> Platform Default
                </div>
                <RadioGroupItem value="default" id="default" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Send instantly using platform verified domain (`no-reply@satahinvoice.com`). Zero setup required.
              </p>
              <Badge variant="secondary" className="text-[10px]">Instant • 100% Ready</Badge>
            </div>

            {/* Card 2: Custom Resend Domain (Coming Soon) */}
            <div 
              className="p-4 rounded-xl border-2 border-border opacity-60 bg-muted/20 cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" /> Custom Domain (DKIM)
                </div>
                <RadioGroupItem value="resend_domain" id="resend_domain" disabled />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Send from your custom domain (`yourdomain.com`). High deliverability with DNS authentication.
              </p>
              <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500">Coming Soon</Badge>
            </div>

            {/* Card 3: Custom SMTP / Gmail */}
            <div 
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                providerType === "smtp" || providerType === "gmail"
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setProviderType("smtp")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Server className="h-4 w-4 text-purple-600" /> SMTP / Gmail
                </div>
                <RadioGroupItem value="smtp" id="smtp" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Connect your personal Gmail, Outlook, or private SMTP server directly.
              </p>
              <Badge variant="outline" className="text-[10px]">Gmail & SMTP</Badge>
            </div>
          </RadioGroup>

          {/* Dynamic Configuration Sections */}



          {/* --- SECTION 3: CUSTOM SMTP / GMAIL SETUP --- */}
          {(providerType === "smtp" || providerType === "gmail") && (
            <div className="p-5 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Server className="h-4 w-4 text-purple-600" /> SMTP & Gmail Server Credentials
                </h4>
                <Button size="sm" variant="outline" onClick={applyGmailPreset} className="text-xs gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-red-500" /> Auto-fill Gmail Settings
                </Button>
              </div>

              {/* Gmail Guide Banner */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-600" /> How to use Gmail?
                </div>
                <ol className="list-decimal list-inside space-y-1 ml-1 text-muted-foreground dark:text-blue-300">
                  <li>Set <strong>SMTP Host</strong> to `smtp.gmail.com` and <strong>Port</strong> to `587`.</li>
                  <li>Enable 2-Step Verification on your Google Account (`myaccount.google.com`).</li>
                  <li>Generate a 16-character <strong>App Password</strong> under Google Security settings.</li>
                  <li>Paste the App Password in the Password field below (do not use your regular Gmail password).</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input 
                    placeholder="e.g. smtp.gmail.com" 
                    value={smtpHost} 
                    onChange={(e) => setSmtpHost(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input 
                    type="number" 
                    placeholder="587" 
                    value={smtpPort} 
                    onChange={(e) => setSmtpPort(Number(e.target.value))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Username / Email</Label>
                  <Input 
                    placeholder="your-email@gmail.com" 
                    value={smtpUser} 
                    onChange={(e) => setSmtpUser(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Password / App Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={smtpPass} 
                    onChange={(e) => setSmtpPass(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch 
                  id="smtp-secure" 
                  checked={smtpSecure} 
                  onCheckedChange={(val) => setSmtpSecure(val)} 
                />
                <Label htmlFor="smtp-secure" className="text-xs cursor-pointer">
                  Use SSL/TLS (Enable for Port 465, disable for Port 587 STARTTLS)
                </Label>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Email Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Test Email Dialog */}
      <Dialog open={testEmailOpen} onOpenChange={setTestEmailOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Verify your current email configuration ({providerType}) by sending a sample test email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Email Address</Label>
              <Input 
                placeholder="yourname@gmail.com" 
                value={testEmailAddress} 
                onChange={(e) => setTestEmailAddress(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleSendTest} disabled={isSendingTest}>
              {isSendingTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
