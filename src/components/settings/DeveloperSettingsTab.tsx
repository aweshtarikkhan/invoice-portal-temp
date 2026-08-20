import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Webhook, Key, Copy, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function DeveloperSettingsTab() {
  const org = useAppStore((s) => s.organization);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  
  useEffect(() => {
    if (org?.id) {
      loadKeys();
      loadWebhooks();
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

  const generateApiKey = async () => {
    const name = prompt("Name this API Key (e.g. 'Zapier Integration'):");
    if (!name) return;
    
    // In a real app, generate securely on backend. Here we simulate for Phase 3 UI.
    const rawKey = `sk_${org!.id.split("-")[0]}_${Math.random().toString(36).substring(2,15)}`;
    
    const { error } = await (supabase as any).from("org_api_keys").insert({
      org_id: org!.id,
      name,
      key_hash: "hash_hidden", 
      preview: rawKey.substring(0, 10) + "..."
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      prompt("Copy this key NOW. You will not see it again:", rawKey);
      loadKeys();
    }
  };

  const addWebhook = async () => {
    const url = prompt("Enter Webhook Endpoint URL (https://...):");
    if (!url || !url.startsWith("http")) return toast.error("Invalid URL");
    
    const { error } = await (supabase as any).from("org_webhooks").insert({
      org_id: org!.id,
      url,
      events: ["*"]
    });
    
    if (error) toast.error(error.message);
    else { toast.success("Webhook added"); loadWebhooks(); }
  };

  const removeKey = async (id: string) => {
    await (supabase as any).from("org_api_keys").delete().eq("id", id);
    loadKeys();
  };
  const removeWebhook = async (id: string) => {
    await (supabase as any).from("org_webhooks").delete().eq("id", id);
    loadWebhooks();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Key className="w-5 h-5 text-indigo-500" /> API Keys</CardTitle>
            <CardDescription>Generate API keys to interact with your CRM data externally.</CardDescription>
          </div>
          <Button onClick={generateApiKey} size="sm"><Plus className="w-4 h-4 mr-2" /> Generate Key</Button>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No API keys generated yet.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {apiKeys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-sm">{k.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-1">{k.preview}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeKey(k.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Webhook className="w-5 h-5 text-emerald-500" /> Webhooks</CardTitle>
            <CardDescription>Receive real-time HTTP POST payloads when events happen.</CardDescription>
          </div>
          <Button onClick={addWebhook} size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Endpoint</Button>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No webhooks configured.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {webhooks.map(w => (
                <div key={w.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">{w.url}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">All Events</Badge>
                      {w.is_active && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]">Active</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeWebhook(w.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
