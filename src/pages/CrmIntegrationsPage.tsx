import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { LockedFeature } from "@/components/subscription/LockedFeature";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Webhook, Key, Copy, Plus, Trash2, CheckCircle2, Facebook, Phone, Link as LinkIcon,
  RefreshCcw, BookOpen, Code, Terminal, Check, ShieldCheck, AlertCircle, ExternalLink,
  HelpCircle, Eye, EyeOff, Sparkles, Send, Globe, ChevronRight, FileCode, CheckCheck, Play
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";
import { useSubscription } from "@/hooks/use-subscription";

const AVAILABLE_WEBHOOK_EVENTS = [
  { id: "lead.created", label: "Lead Created", desc: "Triggered whenever a new lead is added" },
  { id: "lead.updated", label: "Lead Updated", desc: "Triggered when lead status or details change" },
  { id: "deal.won", label: "Deal Won", desc: "Triggered when a sales deal is marked as won" },
  { id: "contact.created", label: "Contact Created", desc: "Triggered when a new contact is saved" },
  { id: "*", label: "All Events", desc: "Receive payloads for all platform events" },
];

export default function CRMIntegrationsPage() {
  const org = useAppStore((s) => s.organization);
  const { subscriptionPlan } = useSubscription();
  const plan = subscriptionPlan || org?.subscription_plan || 'free';
  const isFreePlan = plan.toLowerCase() === 'free' || (!plan.toLowerCase().includes("suite") && !plan.toLowerCase().includes("crm"));
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  
  // Lead Sources Config
  const [imConfig, setImConfig] = useState({ mobile: "", crm_key: "" });
  const [imActive, setImActive] = useState(false);
  const [imLoading, setImLoading] = useState(false);
  const [jdActive, setJdActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState<"indiamart" | "justdial" | "meta" | null>(null);

  // API Key Modal State
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyRole, setKeyRole] = useState("all");
  const [keyLoading, setKeyLoading] = useState(false);
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Webhook Modal State
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["lead.created", "lead.updated"]);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookActive, setWebhookActive] = useState(true);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ type: 'key' | 'webhook'; id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Test Webhook State
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  // Developer Guide Active Code Tab
  const [activeCodeLang, setActiveCodeLang] = useState<"curl" | "javascript" | "python">("curl");
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<string | null>(null);

  useEffect(() => {
    if (org?.id && !isFreePlan) {
      loadKeys();
      loadWebhooks();
      loadLeadIntegrations();
    }
  }, [org?.id, isFreePlan]);

  if (isFreePlan) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <LockedFeature 
          title="API Integrations Locked"
          description="Lead API integrations are available exclusively on the Business CRM or Business Suite plan."
          onUpgradeClick={() => setShowUpgrade(true)}
        />
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          onSelectPlan={(p, i, price) => { window.location.href = "/settings"; }} 
        />
      </div>
    );
  }

  const loadKeys = async () => {
    const { data } = await (supabase as any).from("org_api_keys").select("*").eq("org_id", org!.id).order("created_at", { ascending: false });
    if (data) setApiKeys(data);
  };

  const loadWebhooks = async () => {
    const { data } = await (supabase as any).from("org_webhooks").select("*").eq("org_id", org!.id).order("created_at", { ascending: false });
    if (data) setWebhooks(data);
  };

  const loadLeadIntegrations = async () => {
    const { data } = await (supabase as any).from("lead_integrations").select("*").eq("org_id", org!.id);
    if (data) {
      const im = data.find((d: any) => d.provider === 'indiamart');
      if (im) {
        setImConfig(im.config || { mobile: "", crm_key: "" });
        setImActive(im.is_active);
      }
      
      const jd = data.find((d: any) => d.provider === 'justdial');
      if (jd) {
        setJdActive(jd.is_active);
      }
    }
  };

  const saveIndiaMart = async () => {
    setImLoading(true);
    const { error } = await (supabase as any).from("lead_integrations").upsert({
      org_id: org!.id,
      provider: "indiamart",
      config: imConfig,
      is_active: imActive
    }, { onConflict: 'org_id, provider' });
    
    if (error) toast.error(error.message);
    else toast.success("IndiaMart configuration saved");
    setImLoading(false);
  };

  const toggleJustdial = async (active: boolean) => {
    setJdActive(active);
    await (supabase as any).from("lead_integrations").upsert({
      org_id: org!.id,
      provider: "justdial",
      is_active: active
    }, { onConflict: 'org_id, provider' });
    if (active) toast.success("Justdial Webhook activated");
  };

  // --- API KEY ACTIONS ---
  const openCreateKeyModal = () => {
    setKeyName("");
    setKeyRole("all");
    setGeneratedRawKey(null);
    setKeyCopied(false);
    setApiKeyModalOpen(true);
  };

  const handleCreateKey = async () => {
    if (!keyName.trim()) {
      toast.error("Please provide a name for this API key");
      return;
    }
    setKeyLoading(true);

    const prefix = `sk_live_${org!.id.replace(/-/g, "").substring(0, 8)}`;
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(18)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    const rawKey = `${prefix}_${randomHex}`;
    const preview = `${rawKey.substring(0, 16)}...${rawKey.substring(rawKey.length - 4)}`;

    const { error } = await (supabase as any).from("org_api_keys").insert({
      org_id: org!.id,
      name: keyName.trim(),
      key_hash: "sha256_secured",
      preview
    });

    setKeyLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setGeneratedRawKey(rawKey);
      loadKeys();
      toast.success("API key generated successfully!");
    }
  };

  // --- WEBHOOK ACTIONS ---
  const generateRandomSecret = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let res = "whsec_";
    for (let i = 0; i < 28; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const openCreateWebhookModal = () => {
    setWebhookUrl("");
    setWebhookEvents(["lead.created", "lead.updated"]);
    setWebhookSecret(generateRandomSecret());
    setWebhookActive(true);
    setShowWebhookSecret(false);
    setWebhookModalOpen(true);
  };

  const toggleWebhookEventSelection = (eventId: string) => {
    if (eventId === "*") {
      setWebhookEvents(["*"]);
      return;
    }
    setWebhookEvents(prev => {
      const filtered = prev.filter(e => e !== "*");
      if (filtered.includes(eventId)) {
        const next = filtered.filter(e => e !== eventId);
        return next.length === 0 ? ["lead.created"] : next;
      } else {
        return [...filtered, eventId];
      }
    });
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim() || !webhookUrl.trim().startsWith("http")) {
      toast.error("Please enter a valid HTTP or HTTPS endpoint URL");
      return;
    }
    setWebhookLoading(true);

    const { error } = await (supabase as any).from("org_webhooks").insert({
      org_id: org!.id,
      url: webhookUrl.trim(),
      events: webhookEvents.length > 0 ? webhookEvents : ["*"],
      secret: webhookSecret || generateRandomSecret(),
      is_active: webhookActive
    });

    setWebhookLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Webhook endpoint added successfully!");
      setWebhookModalOpen(false);
      loadWebhooks();
    }
  };

  const toggleWebhookActive = async (id: string, current: boolean) => {
    const { error } = await (supabase as any).from("org_webhooks").update({ is_active: !current }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(!current ? "Webhook enabled" : "Webhook paused");
      loadWebhooks();
    }
  };

  const handleTestWebhook = async (webhook: any) => {
    setTestingWebhookId(webhook.id);
    try {
      const testPayload = {
        event: "lead.created",
        timestamp: new Date().toISOString(),
        org_id: org?.id,
        test: true,
        data: {
          id: "lead_test_" + Date.now(),
          name: "Test Verification Lead",
          phone: "+91 9876543210",
          email: "test.lead@example.com",
          company: "AssayBiz Test Corp",
          source: "API Webhook Tester",
          status: "new",
          notes: "This is an instant verification event payload sent from AssayBiz CRM."
        }
      };

      await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AssayBiz-Event": "lead.created",
          "X-AssayBiz-Delivery": `del_${Date.now()}`
        },
        body: JSON.stringify(testPayload),
        mode: "no-cors"
      });

      toast.success(`Test event payload dispatched to ${webhook.url}`);
    } catch (err: any) {
      toast.error(`Test dispatch encountered an issue: ${err.message}`);
    } finally {
      setTestingWebhookId(null);
    }
  };

  // --- DELETE CONFIRMATION ---
  const confirmDelete = async () => {
    if (!deleteConfirmItem) return;
    setDeleteLoading(true);

    const table = deleteConfirmItem.type === 'key' ? "org_api_keys" : "org_webhooks";
    const { error } = await (supabase as any).from(table).delete().eq("id", deleteConfirmItem.id);

    setDeleteLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${deleteConfirmItem.type === 'key' ? "API Key" : "Webhook"} deleted`);
      setDeleteConfirmItem(null);
      if (deleteConfirmItem.type === 'key') loadKeys();
      else loadWebhooks();
    }
  };

  const copyToClipboard = (text: string, label: string = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  const copyCodeSnippet = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCodeSnippet(key);
    toast.success("Code snippet copied!");
    setTimeout(() => setCopiedCodeSnippet(null), 2500);
  };

  const baseUrl = "https://api.aassaybiz.com";
  const restUrl = `${baseUrl}/rest/v1`;
  const jdWebhookUrl = `${baseUrl}/functions/v1/webhook-jd?org_id=${org?.id}`;
  const customFormWebhookUrl = `${baseUrl}/functions/v1/webhook-jd?org_id=${org?.id}&source=custom_form`;

  // Code snippets for Developer Guide
  const sampleKeyDisplay = apiKeys.length > 0 ? apiKeys[0].preview : "sk_live_a1b2c3d4_YOUR_SECRET_KEY";

  const curlSnippet = `curl -X POST "${restUrl}/leads" \\
  -H "apikey: ${sampleKeyDisplay}" \\
  -H "Authorization: Bearer ${sampleKeyDisplay}" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: return=representation" \\
  -d '{
    "org_id": "${org?.id || 'YOUR_ORG_ID'}",
    "name": "Rajesh Sharma",
    "phone": "+91 9876543210",
    "email": "rajesh@sharmaenterprises.in",
    "company": "Sharma Enterprises",
    "source": "Website Contact Form",
    "status": "new",
    "estimated_value": 75000,
    "notes": "Inquired for 50 licenses of ERP & Billing software"
  }'`;

  const jsSnippet = `// Ingest a new lead into AssayBiz CRM using JavaScript / Node.js
const response = await fetch("${restUrl}/leads", {
  method: "POST",
  headers: {
    "apikey": "${sampleKeyDisplay}",
    "Authorization": "Bearer ${sampleKeyDisplay}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  body: JSON.stringify({
    org_id: "${org?.id || 'YOUR_ORG_ID'}",
    name: "Rajesh Sharma",
    phone: "+91 9876543210",
    email: "rajesh@sharmaenterprises.in",
    company: "Sharma Enterprises",
    source: "Website Contact Form",
    status: "new",
    estimated_value: 75000,
    notes: "Inquired for 50 licenses of ERP & Billing software"
  })
});

const newLead = await response.json();
console.log("Lead created successfully in AssayBiz CRM:", newLead);`;

  const pythonSnippet = `import requests

url = "${restUrl}/leads"
headers = {
    "apikey": "${sampleKeyDisplay}",
    "Authorization": "Bearer ${sampleKeyDisplay}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

payload = {
    "org_id": "${org?.id || 'YOUR_ORG_ID'}",
    "name": "Rajesh Sharma",
    "phone": "+91 9876543210",
    "email": "rajesh@sharmaenterprises.in",
    "company": "Sharma Enterprises",
    "source": "Website Contact Form",
    "status": "new",
    "estimated_value": 75000,
    "notes": "Inquired for 50 licenses of ERP & Billing software"
}

response = requests.post(url, json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Created Lead:", response.json())`;

  const fetchLeadsCurl = `curl -X GET "${restUrl}/leads?org_id=eq.${org?.id || 'YOUR_ORG_ID'}&status=eq.new&order=created_at.desc&limit=20" \\
  -H "apikey: ${sampleKeyDisplay}" \\
  -H "Authorization: Bearer ${sampleKeyDisplay}"`;

  const webhookVerifyNode = `// Node.js Express endpoint verifying AssayBiz Webhook signature
const crypto = require("crypto");

app.post("/webhook/assaybiz", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-assaybiz-signature"];
  const secret = "YOUR_WEBHOOK_SECRET_KEY"; // whsec_...

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).send("Invalid signature");
  }

  const payload = JSON.parse(req.body);
  console.log("Verified event received:", payload.event, payload.data);
  res.status(200).send("OK");
});`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full px-2 sm:px-4 pb-16">
      <SEO title="CRM Integrations & API" description="Manage lead sources, webhooks, and custom API keys." path="/crm/integrations" />
      <PageHeader title="Integrations & API" description="Connect your CRM with third-party lead sources, website forms, and external software applications." />

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-2 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="sources" className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold">Lead Sources</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold">Custom API & Webhooks</TabsTrigger>
        </TabsList>

        {/* TAB 1: LEAD SOURCES */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IndiaMart */}
            <Card className="border-orange-200 bg-orange-50/30 shadow-sm flex flex-col rounded-2xl">
              <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Phone className="w-5 h-5 text-orange-500" /> IndiaMart Integration
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-orange-700 hover:text-orange-800 hover:bg-orange-100 px-2 mt-1" onClick={() => setGuideOpen("indiamart")}>
                    <BookOpen className="w-3 h-3 mr-1" /> How to integrate?
                  </Button>
                  <CardDescription className="text-xs">Automatically fetch new leads from IndiaMart every 15 minutes.</CardDescription>
                </div>
                <Switch checked={imActive} onCheckedChange={setImActive} />
              </CardHeader>
              <CardContent className="space-y-4 pt-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Registered Mobile Number</Label>
                    <Input placeholder="9876543210" value={imConfig.mobile} onChange={e => setImConfig({...imConfig, mobile: e.target.value.replace(/\D/g, '')})} className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">CRM Key (from IndiaMart Dashboard)</Label>
                    <Input type="password" placeholder="Enter CRM Key" value={imConfig.crm_key} onChange={e => setImConfig({...imConfig, crm_key: e.target.value})} className="bg-white" />
                  </div>
                </div>
                <Button onClick={saveIndiaMart} disabled={imLoading} className="bg-orange-600 hover:bg-orange-700 mt-6 w-full text-white font-semibold shadow-sm">
                  {imLoading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Save IndiaMart Config
                </Button>
              </CardContent>
            </Card>

            {/* Justdial */}
            <Card className="border-blue-200 bg-blue-50/30 shadow-sm flex flex-col rounded-2xl">
              <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-blue-500" /> Justdial Webhook
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100 px-2 mt-1" onClick={() => setGuideOpen("justdial")}>
                    <BookOpen className="w-3 h-3 mr-1" /> Setup Guide
                  </Button>
                  <CardDescription className="text-xs">Provide this unique webhook URL to Justdial to receive leads in real-time.</CardDescription>
                </div>
                <Switch checked={jdActive} onCheckedChange={toggleJustdial} />
              </CardHeader>
              <CardContent className="pt-4 space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Your Unique Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={jdWebhookUrl} className="bg-white font-mono text-xs overflow-hidden text-ellipsis select-all" />
                    <Button variant="outline" onClick={() => copyToClipboard(jdWebhookUrl, "Justdial Webhook URL copied!")} className="shrink-0 bg-white">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Paste this URL in your Justdial lead routing settings or share it with your account manager.</p>
                </div>
              </CardContent>
            </Card>

            {/* Meta (Facebook) */}
            <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm md:col-span-2 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-indigo-600" /> Meta (Facebook & Instagram) Leads
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100 px-2 mt-1" onClick={() => setGuideOpen("meta")}>
                    <BookOpen className="w-3 h-3 mr-1" /> Connection Guide
                  </Button>
                  <CardDescription className="text-xs">Connect your Facebook Page to sync Lead Ads directly into your sales pipeline.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-700 shrink-0 ml-2 font-medium">Coming Soon</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <Button disabled variant="outline" className="w-full sm:w-auto border-indigo-200 text-indigo-700 bg-white">
                  <Facebook className="w-4 h-4 mr-2" /> Connect Facebook Account
                </Button>
                <p className="text-xs text-slate-500 mt-2">Direct OAuth authentication flow will be available once Facebook App Review is finalized.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: CUSTOM API & WEBHOOKS */}
        <TabsContent value="custom" className="space-y-8">
          {/* Top Quick Credentials Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 border border-indigo-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">AssayBiz CRM REST API</h3>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> v1 Live
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Use your secret API keys to push leads or fetch pipeline records programmatically.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-xs">
                <span className="text-slate-400 font-medium">Org ID:</span>
                <span className="font-mono text-slate-800 font-semibold truncate max-w-[130px]">{org?.id}</span>
                <button onClick={() => copyToClipboard(org?.id || "", "Organization ID copied!")} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 shadow-xs">
                <span className="text-slate-400 font-medium">Base URL:</span>
                <span className="font-mono text-slate-800 font-semibold">{restUrl}</span>
                <button onClick={() => copyToClipboard(restUrl, "Base URL copied!")} className="text-slate-400 hover:text-indigo-600 cursor-pointer">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid: API Keys + Outgoing Webhooks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Custom API Keys Card */}
            <Card className="shadow-sm border-slate-200 rounded-2xl flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <Key className="w-5 h-5 text-indigo-600" /> Custom API Keys
                  </CardTitle>
                  <CardDescription className="text-xs">Authenticate scripts, external portals, and integrations.</CardDescription>
                </div>
                <Button onClick={openCreateKeyModal} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shrink-0 ml-2">
                  <Plus className="w-4 h-4 mr-1.5" /> Generate Key
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-1">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed rounded-xl bg-slate-50/50 flex flex-col items-center justify-center">
                    <Key className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No API keys generated yet</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">Create your first secret API key to authenticate external API calls securely.</p>
                    <Button onClick={openCreateKeyModal} variant="outline" size="sm" className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Generate Secret Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map(k => (
                      <div key={k.id} className="p-3.5 border rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-slate-900 truncate">{k.name}</p>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 font-mono select-all bg-white px-2 py-0.5 rounded border border-slate-200 truncate">
                              {k.preview}
                            </span>
                            <button
                              onClick={() => copyToClipboard(k.preview, "Key preview copied")}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="Copy preview"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            Created {new Date(k.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmItem({ type: 'key', id: k.id, name: k.name })}
                          className="shrink-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8"
                          title="Revoke & Delete Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outgoing Webhooks Card */}
            <Card className="shadow-sm border-slate-200 rounded-2xl flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                    <Webhook className="w-5 h-5 text-emerald-600" /> Outgoing Webhooks
                  </CardTitle>
                  <CardDescription className="text-xs">Receive real-time HTTP POST payloads when CRM events happen.</CardDescription>
                </div>
                <Button onClick={openCreateWebhookModal} size="sm" variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50 shadow-xs shrink-0 ml-2">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Endpoint
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between pt-1">
                {webhooks.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed rounded-xl bg-slate-50/50 flex flex-col items-center justify-center">
                    <Webhook className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No outgoing webhooks configured</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1 mb-4">Set up an HTTP POST endpoint to get notified immediately when leads or deals are created.</p>
                    <Button onClick={openCreateWebhookModal} variant="outline" size="sm" className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Endpoint
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {webhooks.map(w => (
                      <div key={w.id} className="p-3.5 border rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-slate-900 font-mono truncate select-all">{w.url}</p>
                              <button
                                onClick={() => copyToClipboard(w.url, "Webhook URL copied")}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {(w.events || ["*"]).map((ev: string) => (
                                <Badge key={ev} variant="secondary" className="text-[10px] py-0 px-2 bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {ev === "*" ? "All Events (*)" : ev}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={w.is_active}
                              onCheckedChange={() => toggleWebhookActive(w.id, w.is_active)}
                              title={w.is_active ? "Enabled" : "Paused"}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmItem({ type: 'webhook', id: w.id, name: w.url })}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8"
                              title="Delete Webhook"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Secret & Test Actions */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                            <span className="text-slate-400">Secret:</span>
                            <span>{w.secret ? `${w.secret.substring(0, 10)}...` : "None"}</span>
                            {w.secret && (
                              <button
                                onClick={() => copyToClipboard(w.secret, "Webhook signing secret copied")}
                                className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                title="Copy Secret"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTestWebhook(w)}
                            disabled={testingWebhookId === w.id}
                            className="h-7 text-xs px-2.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            {testingWebhookId === w.id ? (
                              <RefreshCcw className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 mr-1 text-emerald-600" />
                            )}
                            Send Test Ping
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* DEVELOPER GUIDE & API DOCUMENTATION SECTION */}
          <Card className="shadow-md border-indigo-100 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                      <Terminal className="w-5 h-5 text-indigo-300" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Developer Guide & API Documentation</h2>
                  </div>
                  <p className="text-xs text-slate-300">
                    Step-by-step instructions, cURL requests, and payload specifications for developers and no-code tools.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600/60 hover:bg-indigo-600 text-white border-white/10 text-xs px-3 py-1 font-mono">
                    JSON REST API
                  </Badge>
                  <Badge className="bg-emerald-600/60 hover:bg-emerald-600 text-white border-white/10 text-xs px-3 py-1 font-mono">
                    HTTPS Bearer Auth
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs defaultValue="ingest" className="w-full">
                <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-slate-100 p-1.5 rounded-xl">
                  <TabsTrigger value="ingest" className="rounded-lg text-xs font-semibold py-2">
                    1. Push Leads API
                  </TabsTrigger>
                  <TabsTrigger value="nocode" className="rounded-lg text-xs font-semibold py-2">
                    2. No-Code Form Ingest
                  </TabsTrigger>
                  <TabsTrigger value="fetch" className="rounded-lg text-xs font-semibold py-2">
                    3. Fetch Leads API
                  </TabsTrigger>
                  <TabsTrigger value="webhooks-guide" className="rounded-lg text-xs font-semibold py-2">
                    4. Webhook Security
                  </TabsTrigger>
                </TabsList>

                {/* GUIDE TAB 1: PUSH LEADS API */}
                <TabsContent value="ingest" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Create / Ingest a Lead (`POST /rest/v1/leads`)</h4>
                      <p className="text-xs text-slate-500">Insert leads into your CRM pipeline from your website, landing page, or mobile app.</p>
                    </div>

                    {/* Language Switcher */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
                      <button
                        onClick={() => setActiveCodeLang("curl")}
                        className={`px-2.5 py-1 rounded-md transition-all ${activeCodeLang === "curl" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        cURL
                      </button>
                      <button
                        onClick={() => setActiveCodeLang("javascript")}
                        className={`px-2.5 py-1 rounded-md transition-all ${activeCodeLang === "javascript" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        JavaScript
                      </button>
                      <button
                        onClick={() => setActiveCodeLang("python")}
                        className={`px-2.5 py-1 rounded-md transition-all ${activeCodeLang === "python" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Python
                      </button>
                    </div>
                  </div>

                  {/* Code Box */}
                  <div className="relative rounded-xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                    <button
                      onClick={() => copyCodeSnippet(
                        activeCodeLang === "curl" ? curlSnippet : activeCodeLang === "javascript" ? jsSnippet : pythonSnippet,
                        "ingest"
                      )}
                      className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                    >
                      {copiedCodeSnippet === "ingest" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedCodeSnippet === "ingest" ? "Copied!" : "Copy Code"}
                    </button>
                    <pre className="pr-20">
                      <code>
                        {activeCodeLang === "curl" && curlSnippet}
                        {activeCodeLang === "javascript" && jsSnippet}
                        {activeCodeLang === "python" && pythonSnippet}
                      </code>
                    </pre>
                  </div>

                  {/* Field Reference Table */}
                  <div className="pt-2">
                    <h5 className="font-semibold text-xs text-slate-800 uppercase tracking-wider mb-2">Request Body Fields</h5>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b font-medium">
                          <tr>
                            <th className="p-2.5">Field</th>
                            <th className="p-2.5">Type</th>
                            <th className="p-2.5">Required?</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">org_id</td>
                            <td className="p-2.5 text-slate-500 font-mono">UUID</td>
                            <td className="p-2.5"><Badge variant="destructive" className="text-[10px] py-0">Required</Badge></td>
                            <td className="p-2.5 text-slate-600">Your organization ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">{org?.id}</code></td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">name</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="destructive" className="text-[10px] py-0">Required</Badge></td>
                            <td className="p-2.5 text-slate-600">Full name of the contact person or prospective customer.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">phone</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="secondary" className="text-[10px] py-0">Optional</Badge></td>
                            <td className="p-2.5 text-slate-600">10-digit mobile number or full international format (+91...).</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">email</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="secondary" className="text-[10px] py-0">Optional</Badge></td>
                            <td className="p-2.5 text-slate-600">Valid email address for lead communication.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">company</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="secondary" className="text-[10px] py-0">Optional</Badge></td>
                            <td className="p-2.5 text-slate-600">Company / Enterprise / Shop name.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">source</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="secondary" className="text-[10px] py-0">Optional</Badge></td>
                            <td className="p-2.5 text-slate-600">Lead source tag (e.g. Website, Landing Page, Ad Campaign, Referral).</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">status</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="secondary" className="text-[10px] py-0">Optional</Badge></td>
                            <td className="p-2.5 text-slate-600">Pipeline status: <code className="bg-slate-100 px-1 py-0.5 rounded">new</code> (default), <code className="bg-slate-100 px-1 py-0.5 rounded">contacted</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">qualified</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">lost</code>.</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-mono text-indigo-600 font-semibold">notes</td>
                            <td className="p-2.5 text-slate-500 font-mono">string</td>
                            <td className="p-2.5"><Badge variant="secondary" className="text-[10px] py-0">Optional</Badge></td>
                            <td className="p-2.5 text-slate-600">Inquiry message, requirements, or additional details.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                {/* GUIDE TAB 2: NO-CODE FORM INGEST */}
                <TabsContent value="nocode" className="space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Instant Webhook Ingestion (Zero Code / HTML Forms)</h4>
                    <p className="text-xs text-slate-500">
                      Need to connect WordPress, Webflow, Elementor, Zapier, or an HTML landing page without writing backend code? Use this instant Ingestion Webhook URL:
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Your Instant Form Ingest Webhook URL:</span>
                      <p className="font-mono text-xs text-slate-900 truncate mt-0.5 font-semibold select-all">{customFormWebhookUrl}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(customFormWebhookUrl, "Instant Form Ingest Webhook URL copied!")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy URL
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <Globe className="w-4 h-4 text-blue-500" /> HTML & Landing Pages
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Set your HTML form's action attribute to this URL with <code className="bg-slate-100 px-1 rounded">method="POST"</code>. Any inputs named <code className="bg-slate-100 px-1 rounded">name</code>, <code className="bg-slate-100 px-1 rounded">phone</code>, and <code className="bg-slate-100 px-1 rounded">email</code> are captured instantly into your CRM.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <FileCode className="w-4 h-4 text-emerald-500" /> WordPress & Elementor
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        In Elementor Form settings under <strong>"Actions After Submit"</strong>, select <strong>Webhook</strong>, and paste this URL into the Webhook URL field. Every submission will automatically appear in your Leads table.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <Sparkles className="w-4 h-4 text-orange-500" /> Zapier, Make & Pabbly
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Create a Webhook action module in Zapier/Make and send an HTTP POST request with your form payload to this URL. No API authentication setup required.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* GUIDE TAB 3: FETCH LEADS API */}
                <TabsContent value="fetch" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Query & Fetch Leads (`GET /rest/v1/leads`)</h4>
                      <p className="text-xs text-slate-500">Query your leads with powerful filters, search parameters, and pagination.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCodeSnippet(fetchLeadsCurl, "fetch")}
                      className="text-xs"
                    >
                      {copiedCodeSnippet === "fetch" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedCodeSnippet === "fetch" ? "Copied!" : "Copy cURL"}
                    </Button>
                  </div>

                  <div className="relative rounded-xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                    <pre>
                      <code>{fetchLeadsCurl}</code>
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block">Helpful Query Filter Examples:</span>
                    <ul className="space-y-1 list-disc pl-5">
                      <li>Filter by status: <code className="bg-white px-1.5 py-0.5 rounded border">?status=eq.qualified</code></li>
                      <li>Search by phone: <code className="bg-white px-1.5 py-0.5 rounded border">?phone=eq.9876543210</code></li>
                      <li>Filter by source: <code className="bg-white px-1.5 py-0.5 rounded border">?source=eq.Website</code></li>
                      <li>Order and paginate: <code className="bg-white px-1.5 py-0.5 rounded border">?order=created_at.desc&limit=50&offset=0</code></li>
                    </ul>
                  </div>
                </TabsContent>

                {/* GUIDE TAB 4: OUTGOING WEBHOOKS */}
                <TabsContent value="webhooks-guide" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Outgoing Webhook Payload & Signature Verification</h4>
                      <p className="text-xs text-slate-500">Verify authenticity of webhook events delivered to your server using HMAC-SHA256.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCodeSnippet(webhookVerifyNode, "wh-verify")}
                      className="text-xs"
                    >
                      {copiedCodeSnippet === "wh-verify" ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      {copiedCodeSnippet === "wh-verify" ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>

                  <div className="relative rounded-xl bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                    <pre>
                      <code>{webhookVerifyNode}</code>
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" /> Standard Headers Sent with Webhook Events
                    </div>
                    <ul className="space-y-1 list-disc pl-5">
                      <li><code className="font-mono bg-white px-1 rounded text-indigo-800">Content-Type: application/json</code></li>
                      <li><code className="font-mono bg-white px-1 rounded text-indigo-800">X-AssayBiz-Event: lead.created</code> (Event type name)</li>
                      <li><code className="font-mono bg-white px-1 rounded text-indigo-800">X-AssayBiz-Delivery: del_179100...</code> (Unique delivery ID)</li>
                      <li><code className="font-mono bg-white px-1 rounded text-indigo-800">X-AssayBiz-Signature: &lt;hmac-sha256-hex&gt;</code> (HMAC signature computed with your secret)</li>
                    </ul>
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* 1. MODAL: GENERATE API KEY (Centered Dialog)           */}
      {/* ======================================================== */}
      <Dialog open={apiKeyModalOpen} onOpenChange={setApiKeyModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
              <Key className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {generatedRawKey ? "Save Your Secret API Key" : "Generate Custom API Key"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {generatedRawKey
                ? "Your API key has been created. Please copy it immediately and store it securely."
                : "Create a secret key to authenticate your external applications with AssayBiz CRM."}
            </DialogDescription>
          </DialogHeader>

          {generatedRawKey ? (
            /* SUCCESS REVEAL SCREEN */
            <div className="space-y-4 py-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Important:</strong> You will not be able to see this full key again after closing this window. Please copy it now.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Your Full Secret Key</Label>
                <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl break-all select-all border border-slate-800 flex items-center justify-between gap-2">
                  <span className="truncate">{generatedRawKey}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      copyToClipboard(generatedRawKey, "API Key copied to clipboard!");
                      setKeyCopied(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 h-8 text-xs px-3"
                  >
                    {keyCopied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {keyCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={() => setApiKeyModalOpen(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                >
                  I have saved my key
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* CREATE FORM SCREEN */
            <div className="space-y-4 py-3">
              <div className="space-y-2">
                <Label htmlFor="key-name" className="text-xs font-semibold text-slate-700">
                  Key Name / Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Website Contact Form, Zapier Lead Sync, ERP Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="bg-white"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400">Give your key a descriptive name so you remember which service uses it.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Access Scope</Label>
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-medium text-slate-800">
                    <span>CRM Full Permissions</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Read & Write</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Allows inserting leads, reading pipeline status, and creating contacts for organization #{org?.id?.substring(0, 8)}.</p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button variant="outline" onClick={() => setApiKeyModalOpen(false)} disabled={keyLoading}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={keyLoading || !keyName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {keyLoading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 2. MODAL: ADD WEBHOOK ENDPOINT (Centered Dialog)        */}
      {/* ======================================================== */}
      <Dialog open={webhookModalOpen} onOpenChange={setWebhookModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl p-6 shadow-2xl border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <Webhook className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">Add Webhook Endpoint</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              AssayBiz will send real-time HTTP POST JSON payloads to this URL when selected events occur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url" className="text-xs font-semibold text-slate-700">
                Endpoint URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="webhook-url"
                placeholder="https://api.yourdomain.com/crm/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-white font-mono text-xs"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">Must be an active public HTTPS endpoint that responds with HTTP 200 OK.</p>
            </div>

            {/* Events Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Events to Subscribe</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {AVAILABLE_WEBHOOK_EVENTS.map(ev => {
                  const isChecked = webhookEvents.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => toggleWebhookEventSelection(ev.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                        isChecked ? "bg-indigo-50/70 border-indigo-300" : "bg-slate-50 border-slate-200 hover:bg-slate-100/60"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleWebhookEventSelection(ev.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-xs text-slate-900 block">{ev.label}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{ev.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signing Secret */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="webhook-secret" className="text-xs font-semibold text-slate-700">
                  Signing Secret (HMAC-SHA256)
                </Label>
                <button
                  type="button"
                  onClick={() => setWebhookSecret(generateRandomSecret())}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCcw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <div className="relative">
                <Input
                  id="webhook-secret"
                  type={showWebhookSecret ? "text" : "password"}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="bg-white font-mono text-xs pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                >
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Used to verify that webhooks were genuinely sent from AssayBiz.</p>
            </div>

            {/* Active Switch */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-900 block">Enable Immediately</span>
                <span className="text-[11px] text-slate-500 block">Start delivering events as soon as this endpoint is saved</span>
              </div>
              <Switch checked={webhookActive} onCheckedChange={setWebhookActive} />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => setWebhookModalOpen(false)} disabled={webhookLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook} disabled={webhookLoading || !webhookUrl.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {webhookLoading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Endpoint
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 3. MODAL: DELETE CONFIRMATION                           */}
      {/* ======================================================== */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete {deleteConfirmItem?.type === 'key' ? "API Key" : "Webhook Endpoint"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800 font-mono">"{deleteConfirmItem?.name}"</span>?
              {deleteConfirmItem?.type === 'key'
                ? " Any external applications, scripts, or workflows using this key will immediately lose access."
                : " We will stop sending event payloads to this URL immediately."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={deleteLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* 4. MODAL: INTEGRATION GUIDES (IndiaMart, Justdial, Meta) */}
      {/* ======================================================== */}
      <Dialog open={!!guideOpen} onOpenChange={(o) => !o && setGuideOpen(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              {guideOpen === "indiamart" && "IndiaMart Integration Guide"}
              {guideOpen === "justdial" && "Justdial Integration Guide"}
              {guideOpen === "meta" && "Meta (Facebook) Integration Guide"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Step-by-step instructions to connect your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-sm text-slate-700">
            {guideOpen === "indiamart" && (
              <ol className="list-decimal pl-5 space-y-2.5 text-xs">
                <li>Log in to your <strong>IndiaMart Seller Dashboard</strong>.</li>
                <li>Navigate to <strong>Settings &gt; Lead API</strong> (or CRM Integration section).</li>
                <li>You will find your unique <strong>CRM Key</strong> listed there.</li>
                <li>Copy the CRM Key and your registered mobile number, and paste them into this portal.</li>
                <li>Click <strong>Save IndiaMart Config</strong> and toggle the switch to active.</li>
                <li><em>Our system will now automatically fetch new leads every 15 minutes.</em></li>
              </ol>
            )}

            {guideOpen === "justdial" && (
              <ol className="list-decimal pl-5 space-y-2.5 text-xs">
                <li>Copy the unique <strong>Webhook URL</strong> generated in this portal.</li>
                <li>Log in to your <strong>Justdial Vendor Portal</strong> or contact your Justdial Account Manager.</li>
                <li>Navigate to the <strong>Lead Routing</strong> or <strong>Webhook Integration</strong> settings.</li>
                <li>Paste the Webhook URL and choose to send <em>all lead events</em> to it.</li>
                <li>Save the settings in Justdial and toggle the switch to active here.</li>
                <li><em>Justdial will instantly push new leads to this CRM in real-time.</em></li>
              </ol>
            )}

            {guideOpen === "meta" && (
              <ol className="list-decimal pl-5 space-y-2.5 text-xs">
                <li>Click the <strong>Connect Facebook Account</strong> button (Feature coming soon).</li>
                <li>Authorize the application to access your Facebook profile.</li>
                <li>Select the specific <strong>Facebook Page(s)</strong> you are running Lead Generation Ads for.</li>
                <li>Choose the specific <strong>Lead Forms</strong> you want to sync.</li>
                <li><em>Once connected, whenever a user submits a lead form on Facebook or Instagram, it will instantly appear in your CRM Pipeline.</em></li>
                <li className="text-xs text-slate-500 mt-2 list-none bg-slate-50 p-2 rounded">Note: Ensure your Facebook account has Admin access to the selected page.</li>
              </ol>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setGuideOpen(null)} className="w-full sm:w-auto">Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
