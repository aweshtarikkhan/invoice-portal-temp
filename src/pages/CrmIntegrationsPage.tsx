import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Webhook, Key, Copy, Plus, Trash2, CheckCircle2, Facebook, Phone, Link as LinkIcon, RefreshCcw, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { SEO } from "@/components/shared/SEO";

export default function CrmIntegrationsPage() {
  const org = useAppStore((s) => s.organization);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  
  const [imConfig, setImConfig] = useState({ mobile: "", crm_key: "" });
  const [imActive, setImActive] = useState(false);
  const [imLoading, setImLoading] = useState(false);

  const [jdActive, setJdActive] = useState(false);
  const [guideOpen, setGuideOpen] = useState<"indiamart" | "justdial" | "meta" | null>(null);
  
  useEffect(() => {
    if (org?.id) {
      loadKeys();
      loadWebhooks();
      loadLeadIntegrations();
    }
  }, [org?.id]);

  const loadKeys = async () => {
    const { data } = await (supabase as any).from("org_api_keys").select("*").eq("org_id", org!.id);
    if (data) setApiKeys(data);
  };

  const loadWebhooks = async () => {
    const { data } = await (supabase as any).from("org_webhooks").select("*").eq("org_id", org!.id);
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

  const generateApiKey = async () => {
    const name = prompt("Name this API Key (e.g. 'Zapier Integration'):");
    if (!name) return;
    const rawKey = `sk_${org!.id.split("-")[0]}_${Math.random().toString(36).substring(2,15)}`;
    const { error } = await (supabase as any).from("org_api_keys").insert({
      org_id: org!.id, name, key_hash: "hash_hidden", preview: rawKey.substring(0, 10) + "..."
    });
    if (error) toast.error(error.message);
    else { prompt("Copy this key NOW. You will not see it again:", rawKey); loadKeys(); }
  };

  const addWebhook = async () => {
    const url = prompt("Enter Webhook Endpoint URL (https://...):");
    if (!url || !url.startsWith("http")) return toast.error("Invalid URL");
    const { error } = await (supabase as any).from("org_webhooks").insert({
      org_id: org!.id, url, events: ["*"]
    });
    if (error) toast.error(error.message);
    else { toast.success("Webhook added"); loadWebhooks(); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const jdWebhookUrl = `https://ewnsxsnjcolhdehrdrhf.supabase.co/functions/v1/webhook-jd?org_id=${org?.id}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full px-2 sm:px-4 pb-12">
      <SEO title="CRM Integrations & API" description="Manage lead sources, webhooks, and API keys." path="/crm/integrations" />
      <PageHeader title="Integrations & API" description="Connect your CRM with third-party lead sources and external applications." />

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto gap-2">
          <TabsTrigger value="sources" className="flex-1 sm:flex-none">Lead Sources</TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 sm:flex-none">Custom API & Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* IndiaMart */}
            <Card className="border-orange-200 bg-orange-50/30 shadow-sm flex flex-col">
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
                    <Label>Registered Mobile Number</Label>
                    <Input placeholder="9876543210" value={imConfig.mobile} onChange={e => setImConfig({...imConfig, mobile: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>CRM Key (from IndiaMart Dashboard)</Label>
                    <Input type="password" placeholder="Enter CRM Key" value={imConfig.crm_key} onChange={e => setImConfig({...imConfig, crm_key: e.target.value})} />
                  </div>
                </div>
                <Button onClick={saveIndiaMart} disabled={imLoading} className="bg-orange-600 hover:bg-orange-700 mt-6 w-full">
                  {imLoading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Save IndiaMart Config
                </Button>
              </CardContent>
            </Card>

            {/* Justdial */}
            <Card className="border-blue-200 bg-blue-50/30 shadow-sm flex flex-col">
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
                  <Label>Your Unique Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={jdWebhookUrl} className="bg-white font-mono text-xs overflow-hidden text-ellipsis" />
                    <Button variant="outline" onClick={() => copyToClipboard(jdWebhookUrl)} className="shrink-0">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Paste this URL in your Justdial lead routing settings.</p>
                </div>
              </CardContent>
            </Card>

            {/* Meta (Facebook) */}
            <Card className="border-indigo-200 bg-indigo-50/30 shadow-sm md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-indigo-600" /> Meta (Facebook) Leads
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100 px-2 mt-1" onClick={() => setGuideOpen("meta")}>
                    <BookOpen className="w-3 h-3 mr-1" /> Connection Guide
                  </Button>
                  <CardDescription className="text-xs">Connect your Facebook Page to sync Lead Ads directly into the CRM.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-700 shrink-0 ml-2">Coming Soon</Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <Button disabled variant="outline" className="w-full sm:w-auto border-indigo-200 text-indigo-700 bg-white">
                  <Facebook className="w-4 h-4 mr-2" /> Connect Facebook Account
                </Button>
                <p className="text-xs text-slate-500 mt-2">Authentication flow will be available once Facebook App Review is complete.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2"><Key className="w-5 h-5 text-indigo-500" /> Custom API Keys</CardTitle>
                  <CardDescription className="text-xs">Generate API keys to interact with your CRM data externally.</CardDescription>
                </div>
                <Button onClick={generateApiKey} size="sm" className="shrink-0 ml-2"><Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Generate Key</span><span className="sm:hidden">Key</span></Button>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center border rounded-lg bg-slate-50 border-dashed">No API keys generated yet.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {apiKeys.map(k => (
                      <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="overflow-hidden mr-2">
                          <p className="font-medium text-sm truncate">{k.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">{k.preview}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => (supabase as any).from("org_api_keys").delete().eq("id", k.id).then(loadKeys)} className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2"><Webhook className="w-5 h-5 text-emerald-500" /> Outgoing Webhooks</CardTitle>
                  <CardDescription className="text-xs">Receive real-time HTTP POST payloads when events happen.</CardDescription>
                </div>
                <Button onClick={addWebhook} size="sm" variant="outline" className="shrink-0 ml-2"><Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">Add Endpoint</span><span className="sm:hidden">Add</span></Button>
              </CardHeader>
              <CardContent>
                {webhooks.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center border rounded-lg bg-slate-50 border-dashed">No outgoing webhooks configured.</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {webhooks.map(w => (
                      <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="overflow-hidden mr-2">
                          <p className="font-medium text-sm truncate">{w.url}</p>
                          <div className="flex gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">All Events</Badge></div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => (supabase as any).from("org_webhooks").delete().eq("id", w.id).then(loadWebhooks)} className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Guides Dialog */}
      <Dialog open={!!guideOpen} onOpenChange={(o) => !o && setGuideOpen(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {guideOpen === "indiamart" && "IndiaMart Integration Guide"}
              {guideOpen === "justdial" && "Justdial Integration Guide"}
              {guideOpen === "meta" && "Meta (Facebook) Integration Guide"}
            </DialogTitle>
            <DialogDescription>
              Step-by-step instructions to connect your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-sm text-slate-700">
            {guideOpen === "indiamart" && (
              <ol className="list-decimal pl-5 space-y-3">
                <li>Log in to your <strong>IndiaMart Seller Dashboard</strong>.</li>
                <li>Navigate to <strong>Settings &gt; Lead API</strong> (or CRM Integration section).</li>
                <li>You will find your unique <strong>CRM Key</strong> listed there.</li>
                <li>Copy the CRM Key and your registered mobile number, and paste them into this portal.</li>
                <li>Click <strong>Save</strong> and toggle the switch to active.</li>
                <li><em>Our system will now automatically fetch new leads every 15 minutes.</em></li>
              </ol>
            )}

            {guideOpen === "justdial" && (
              <ol className="list-decimal pl-5 space-y-3">
                <li>Copy the unique <strong>Webhook URL</strong> generated in this portal.</li>
                <li>Log in to your <strong>Justdial Vendor Portal</strong> or contact your Justdial Account Manager.</li>
                <li>Navigate to the <strong>Lead Routing</strong> or <strong>Webhook Integration</strong> settings.</li>
                <li>Paste the Webhook URL and choose to send <em>all lead events</em> to it.</li>
                <li>Save the settings in Justdial and toggle the switch to active here.</li>
                <li><em>Justdial will instantly push new leads to this CRM in real-time.</em></li>
              </ol>
            )}

            {guideOpen === "meta" && (
              <ol className="list-decimal pl-5 space-y-3">
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
            <Button onClick={() => setGuideOpen(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
