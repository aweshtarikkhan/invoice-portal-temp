import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Workflow, Mail, FileText, Zap } from "lucide-react";
import { toast } from "sonner";

export default function CRMAutomationsPage() {
  const org = useAppStore((s) => s.organization);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (org?.id) fetchAutomations();
  }, [org?.id]);

  const fetchAutomations = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", org!.id);
      
    if (data) setAutomations(data);
    setLoading(false);
  };

  const toggleAutomation = async (trigger: string, action: string, current: boolean, name: string) => {
    const existing = automations.find(a => a.trigger_event === trigger && a.action_type === action);
    
    if (existing) {
      const { error } = await (supabase as any)
        .from("crm_automations")
        .update({ is_active: !current })
        .eq("id", existing.id);
        
      if (!error) {
        setAutomations(automations.map(a => a.id === existing.id ? { ...a, is_active: !current } : a));
        toast.success(current ? "Automation disabled" : "Automation enabled");
      }
    } else {
      const { data, error } = await (supabase as any)
        .from("crm_automations")
        .insert({
          org_id: org!.id,
          name,
          trigger_event: trigger,
          action_type: action,
          is_active: true
        }).select().single();
        
      if (!error && data) {
        setAutomations([...automations, data]);
        toast.success("Automation enabled");
      }
    }
  };

  const isEnabled = (trigger: string, action: string) => {
    return automations.some(a => a.trigger_event === trigger && a.action_type === action && a.is_active);
  };

  const presets = [
    {
      name: "Welcome Email for New Leads",
      description: "Automatically send a welcome email when a new lead is added to the system.",
      trigger_event: "lead_created",
      action_type: "send_email",
      icon: <Mail className="w-5 h-5 text-blue-500" />
    },
    {
      name: "Auto-Convert Won Deals",
      description: "When a deal is marked as 'Won', automatically create a Customer record and a Draft Invoice.",
      trigger_event: "deal_won",
      action_type: "convert_customer_and_invoice",
      icon: <FileText className="w-5 h-5 text-emerald-500" />
    }
  ];

  return (
    <>
      <div className="flex-1 space-y-6 p-8 bg-slate-50 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-8 h-8 text-amber-500" />
              Automations & Workflows
            </h1>
            <p className="text-muted-foreground mt-1">Automate repetitive CRM tasks to save time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {presets.map((preset, i) => (
            <Card key={i} className="border-slate-200/60 shadow-sm rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Switch 
                  checked={isEnabled(preset.trigger_event, preset.action_type)} 
                  onCheckedChange={(val) => toggleAutomation(preset.trigger_event, preset.action_type, !val, preset.name)} 
                />
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 border border-slate-200/50">
                  {preset.icon}
                </div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {preset.name}
                  {isEnabled(preset.trigger_event, preset.action_type) && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/50">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm pt-2">{preset.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Workflow className="w-4 h-4" />
                  <span><strong>Trigger:</strong> {preset.trigger_event}</span>
                  <span className="text-slate-300">→</span>
                  <span><strong>Action:</strong> {preset.action_type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
