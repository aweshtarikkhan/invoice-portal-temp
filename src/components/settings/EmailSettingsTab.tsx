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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
      const effectiveFromEmail = 
        providerType === "resend_domain" && domainName.trim()
          ? `no-reply@${domainName.trim().toLowerCase()}`
          : (providerType === "smtp" || providerType === "gmail") && smtpUser.trim()
          ? smtpUser.trim()
          : "no-reply@test.satahinvoice.com";

      const payload: any = {
        org_id: org.id,
        provider_type: providerType,
        from_name: fromName,
        from_email: effectiveFromEmail,
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

      // Also ensure backend PostgreSQL receives updated configuration
      try {
        await fetch("/api/domain/save-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgId: org.id,
            providerType,
            fromName,
            domainName,
            smtpHost,
            smtpPort: Number(smtpPort),
            smtpUser,
            smtpPass,
            smtpSecure,
          }),
        });
      } catch (backendErr) {
        console.warn("Direct backend save warning:", backendErr);
      }

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

  // Register Custom Domain via AWS SES
  const handleRegisterDomain = async () => {
    if (!domainName.trim() || !org?.id) {
      toast({ variant: "destructive", title: "Please enter a valid domain name" });
      return;
    }

    setIsRegisteringDomain(true);
    try {
      const resp = await fetch("/api/domain/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domainName.trim(),
          orgId: org.id,
        }),
      });

      const resData = await resp.json();
      if (!resp.ok || resData.error) throw new Error(resData.error || "Failed to register domain in AWS SES");

      setResendDomainId(resData.data.id);
      setDnsRecords(resData.data.records || []);
      setDomainStatus(resData.data.status || "pending");

      toast({
        title: "Domain Registered in AWS SES",
        description: "DKIM & Verification DNS records generated! Add them to your domain provider.",
      });

      queryClient.invalidateQueries({ queryKey: ["org-email-settings"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Domain Registration Failed", description: err.message });
    } finally {
      setIsRegisteringDomain(false);
    }
  };

  // Verify Custom Domain via AWS SES
  const handleVerifyDomain = async () => {
    if (!domainName.trim() || !org?.id) return;

    setIsVerifyingDomain(true);
    try {
      const resp = await fetch("/api/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: domainName.trim(),
          orgId: org.id,
        }),
      });

      const resData = await resp.json();
      if (!resp.ok || resData.error) throw new Error(resData.error || "Failed to check verification");

      setDomainStatus(resData.status);
      if (resData.data?.records) {
        setDnsRecords(resData.data.records);
      }

      if (resData.status === "verified") {
        toast({
          title: "Domain 100% Verified!",
          description: "Your custom domain is authenticated via AWS SES DKIM and ready to send emails.",
        });
      } else {
        toast({
          title: "Verification Pending in AWS SES",
          description: "DNS changes can take 5-10 minutes to propagate. If already added, please wait a moment.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["org-email-settings"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Check Failed", description: err.message });
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmailAddress.trim() || !org?.id) return;

    setIsSendingTest(true);
    try {
      // First auto-save settings so the edge function and server read current choices
      await handleSave();

      const effectiveFromEmail = 
        providerType === "resend_domain" && domainName.trim()
          ? `no-reply@${domainName.trim().toLowerCase()}`
          : (providerType === "smtp" || providerType === "gmail") && smtpUser.trim()
          ? smtpUser.trim()
          : "no-reply@test.satahinvoice.com";

      const effectiveFromName = fromName || org?.name || "Assay Biz";

      // Try EC2 native email dispatcher first (supports AWS SES & Custom SMTP reliably)
      let sentSuccessfully = false;
      try {
        const resp = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orgId: org.id,
            fromEmail: effectiveFromEmail,
            fromName: effectiveFromName,
            to: testEmailAddress.trim(),
            subject: "Test Email from Assay Biz",
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2563eb;">Test Email Successful! 🎉</h2>
                <p>Hello,</p>
                <p>This is a test email sent from your application using your configured email sending method (<strong>${providerType}</strong>).</p>
                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Sent at: ${new Date().toLocaleString()}</p>
              </div>
            `,
          }),
        });
        const respData = await resp.json();
        if (resp.ok && respData.success) {
          sentSuccessfully = true;
        } else if (!resp.ok && respData.error) {
          throw new Error(respData.error);
        }
      } catch (err: any) {
        console.warn("EC2 mailer failed or unavailable, trying cloud function:", err);
      }

      if (!sentSuccessfully) {
        const { data, error } = await supabase.functions.invoke("send-email-dispatcher", {
          body: {
            orgId: org.id,
            fromEmail: effectiveFromEmail,
            fromName: effectiveFromName,
            to: testEmailAddress.trim(),
            subject: "Test Email from Assay Biz",
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #2563eb;">Test Email Successful! 🎉</h2>
                <p>Hello,</p>
                <p>This is a test email sent from your application using your configured email sending method (<strong>${providerType}</strong>).</p>
                <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Sent at: ${new Date().toLocaleString()}</p>
              </div>
            `,
          },
        });

        if (error || data?.error) throw new Error(error?.message || data?.error);
      }

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
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  Sender Display Name
                </Label>
                <Input 
                  value={fromName} 
                  onChange={(e) => setFromName(e.target.value)} 
                  placeholder="e.g. Assay Biz Billing or Your Business Name"
                />
                <p className="text-xs text-muted-foreground">
                  The business name clients will see in their Inbox (e.g. "Acme Corp Billing").
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center justify-between">
                  <span>Sending Email Address</span>
                  <Badge variant="outline" className="text-[10px] font-mono font-normal">
                    System Managed
                  </Badge>
                </Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted/60 flex items-center justify-between text-sm text-muted-foreground select-none">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-mono text-xs text-foreground truncate">
                      {providerType === "resend_domain" && domainName.trim()
                        ? `no-reply@${domainName.trim()}`
                        : (providerType === "smtp" || providerType === "gmail") && smtpUser
                        ? smtpUser
                        : "no-reply@test.satahinvoice.com"}
                    </span>
                  </div>
                  <Badge 
                    variant={providerType === "resend_domain" && domainStatus === "verified" ? "default" : "secondary"}
                    className="text-[10px] shrink-0 ml-2"
                  >
                    {providerType === "resend_domain" && domainStatus === "verified" 
                      ? "Custom Verified" 
                      : (providerType === "smtp" || providerType === "gmail")
                      ? "SMTP Auth" 
                      : "Platform Verified"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Fixed to your verified AWS SES or SMTP sender to ensure 100% email deliverability.
                </p>
              </div>
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

            {/* Card 2: Custom AWS SES Domain */}
            <div 
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                providerType === "resend_domain" 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setProviderType("resend_domain")}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Globe className="h-4 w-4 text-blue-600" /> Custom Domain (AWS SES)
                </div>
                <RadioGroupItem value="resend_domain" id="resend_domain" />
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Send from your custom domain (`yourdomain.com`). Authenticated via AWS SES DKIM tokens.
              </p>
              <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-600 bg-blue-50/50">AWS SES • DKIM</Badge>
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

          {/* --- SECTION 2: CUSTOM AWS SES DOMAIN SETUP --- */}
          {providerType === "resend_domain" && (
            <div className="p-5 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" /> Custom Domain Authentication (AWS SES)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect your own domain with DKIM and TXT records for 100% inbox delivery.
                  </p>
                </div>
                <Badge 
                  variant={domainStatus === "verified" ? "default" : "secondary"}
                  className={domainStatus === "verified" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-amber-100 text-amber-800 border-amber-300"}
                >
                  {domainStatus === "verified" ? "✓ Verified & Active" : "Verification Pending"}
                </Badge>
              </div>

              {/* Domain Registration Form */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input 
                    placeholder="e.g. yourcompany.com" 
                    value={domainName} 
                    onChange={(e) => setDomainName(e.target.value)} 
                    disabled={isRegisteringDomain || isVerifyingDomain}
                  />
                </div>
                <Button 
                  onClick={handleRegisterDomain} 
                  disabled={isRegisteringDomain || !domainName.trim()}
                  className="gap-2"
                >
                  {isRegisteringDomain && <Loader2 className="h-4 w-4 animate-spin" />}
                  Generate DNS Records
                </Button>
                {dnsRecords && dnsRecords.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleVerifyDomain} 
                    disabled={isVerifyingDomain}
                    className="gap-2"
                  >
                    {isVerifyingDomain && <Loader2 className="h-4 w-4 animate-spin" />}
                    Check Verification
                  </Button>
                )}
              </div>

              {/* DNS Records Table */}
              {dnsRecords && dnsRecords.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Add these DNS records to your domain provider (Cloudflare, GoDaddy, Hostinger, etc.):</span>
                  </div>

                  <div className="overflow-x-auto border rounded-lg bg-white dark:bg-slate-950">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-slate-50 dark:bg-slate-900 text-muted-foreground font-medium">
                          <th className="p-2.5 text-left">Type</th>
                          <th className="p-2.5 text-left">Record / Purpose</th>
                          <th className="p-2.5 text-left">Host / Name</th>
                          <th className="p-2.5 text-left">Value / Points to</th>
                          <th className="p-2.5 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono">
                        {dnsRecords.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                            <td className="p-3 font-semibold text-blue-600 whitespace-nowrap">{r.type}</td>
                            <td className="p-3 font-sans text-muted-foreground whitespace-nowrap">{r.record || "DKIM / TXT"}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 group">
                                <span className="select-all text-[12px] font-mono break-all text-foreground" title={r.name}>{r.name}</span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => copyToClipboard(r.name, `name-${i}`, "Host / Name")}
                                  title="Copy Host"
                                >
                                  {copiedKey === `name-${i}` ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2 group">
                                <span className="select-all text-[12px] font-mono break-all text-foreground" title={r.value}>{r.value}</span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => copyToClipboard(r.value, `val-${i}`, "Value / Target")}
                                  title="Copy Value"
                                >
                                  {copiedKey === `val-${i}` ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 font-sans whitespace-nowrap">
                              {r.status === "verified" || domainStatus === "verified" ? (
                                <span className="text-emerald-600 font-semibold">✓ Verified</span>
                              ) : (
                                <span className="text-amber-600 font-medium">Pending</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

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
