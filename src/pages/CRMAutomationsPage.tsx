import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Workflow, 
  Mail, 
  MessageSquare, 
  Zap, 
  Award, 
  PartyPopper, 
  Eye, 
  CheckCircle2, 
  Send, 
  Sparkles,
  PhoneCall
} from "lucide-react";
import { toast } from "sonner";
import {
  getDealWonEmailHtml,
  getDealWonWhatsappText,
  getLeadWelcomeEmailHtml,
  getLeadWelcomeWhatsappText,
} from "@/lib/crm-automations";

interface PresetAutomation {
  id: string;
  name: string;
  category: "email" | "whatsapp";
  description: string;
  trigger_event: string;
  action_type: string;
  icon: React.ReactNode;
  badgeColor: string;
}

export default function CRMAutomationsPage() {
  const org = useAppStore((s) => s.organization);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activePreview, setActivePreview] = useState<PresetAutomation | null>(null);

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
    const existing = automations.find((a) => a.trigger_event === trigger && a.action_type === action);

    if (existing) {
      const { error } = await (supabase as any)
        .from("crm_automations")
        .update({ is_active: !current })
        .eq("id", existing.id);

      if (!error) {
        setAutomations(automations.map((a) => (a.id === existing.id ? { ...a, is_active: !current } : a)));
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
          is_active: true,
        })
        .select()
        .single();

      if (!error && data) {
        setAutomations([...automations, data]);
        toast.success("Automation enabled");
      }
    }
  };

  const isEnabled = (trigger: string, action: string) => {
    return automations.some((a) => a.trigger_event === trigger && a.action_type === action && a.is_active);
  };

  const presets: PresetAutomation[] = [
    {
      id: "deal-won-email",
      name: "Deal Won Client Onboarding & Thank You Email",
      category: "email",
      description: "When a deal is marked as 'Won', automatically send a high-impact branded Onboarding & Thank You Email to the client confirming deal closure and next steps.",
      trigger_event: "deal_won",
      action_type: "send_deal_won_email",
      icon: <Award className="w-5 h-5 text-amber-500" />,
      badgeColor: "bg-amber-500/10 text-amber-700 border-amber-200",
    },
    {
      id: "deal-won-whatsapp",
      name: "Deal Won WhatsApp Celebration & Confirmation",
      category: "whatsapp",
      description: "When a deal is marked as 'Won', automatically send an instant WhatsApp celebration message thanking the customer, confirming the deal value, and providing dedicated support info.",
      trigger_event: "deal_won",
      action_type: "send_deal_won_whatsapp",
      icon: <PartyPopper className="w-5 h-5 text-purple-500" />,
      badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200",
    },
    {
      id: "lead-welcome-email",
      name: "Welcome Email for New Leads",
      category: "email",
      description: "Automatically send a branded welcome email when a new lead is added to the system, setting expectations and introducing your company.",
      trigger_event: "lead_created",
      action_type: "send_email",
      icon: <Mail className="w-5 h-5 text-blue-500" />,
      badgeColor: "bg-blue-500/10 text-blue-700 border-blue-200",
    },
    {
      id: "lead-welcome-whatsapp",
      name: "Welcome WhatsApp for New Leads",
      category: "whatsapp",
      description: "Automatically trigger a warm, instant greeting WhatsApp message when a new lead is captured with a valid phone number.",
      trigger_event: "lead_created",
      action_type: "send_whatsapp",
      icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    },
  ];

  const handleOpenPreview = (preset: PresetAutomation) => {
    setActivePreview(preset);
    setPreviewOpen(true);
  };

  const sampleLead = {
    name: "Rahul Verma",
    email: "rahul.verma@example.com",
    phone: "9876543210",
    company: "Apex Enterprises",
  };

  const sampleDeal = {
    title: "Annual Cloud Management Package",
    amount: 150000,
  };

  const sampleRecipient = {
    name: "Vikram Malhotra",
    email: "vikram@malhotratech.com",
    phone: "9812345678",
  };

  return (
    <>
      <div className="flex-1 space-y-6 p-8 bg-slate-50 overflow-y-auto h-[calc(100vh-4rem)]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-200/50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Automations & Workflows
                </h1>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  Supercharge your sales cycle with automated, personalized WhatsApp and Email communication when deals close and leads arrive.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              {automations.filter((a) => a.is_active).length} of {presets.length} Active
            </Badge>
          </div>
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {presets.map((preset) => {
            const active = isEnabled(preset.trigger_event, preset.action_type);
            return (
              <Card
                key={preset.id}
                className={`border transition-all duration-200 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md ${
                  active ? "border-slate-300 bg-white" : "border-slate-200/70 bg-white/70 opacity-90"
                }`}
              >
                {/* Switch Toggle */}
                <div className="absolute top-4 right-4 z-10">
                  <Switch
                    checked={active}
                    onCheckedChange={(val) =>
                      toggleAutomation(preset.trigger_event, preset.action_type, !val, preset.name)
                    }
                  />
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200/50 shadow-inner">
                      {preset.icon}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize font-medium ${preset.badgeColor}`}>
                      {preset.category === "email" ? (
                        <Mail className="w-3 h-3 mr-1" />
                      ) : (
                        <MessageSquare className="w-3 h-3 mr-1" />
                      )}
                      {preset.category}
                    </Badge>
                    {active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-slate-400">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg font-semibold text-slate-900 leading-snug">
                    {preset.name}
                  </CardTitle>
                  <CardDescription className="text-sm pt-1 text-slate-600 leading-relaxed">
                    {preset.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 truncate">
                      <Workflow className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong>Trigger:</strong> <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[11px]">{preset.trigger_event}</code></span>
                      <span className="text-slate-300">→</span>
                      <span><strong>Action:</strong> <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[11px]">{preset.action_type}</code></span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(preset)}
                      className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 h-7 gap-1 shrink-0 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Message Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                {activePreview?.category === "email" ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  {activePreview?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Live preview of the message dispatched to the customer when triggered.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {activePreview && (
            <div className="py-2">
              {activePreview.category === "email" ? (
                <div className="space-y-4">
                  <div className="bg-slate-100 p-3 rounded-lg text-xs space-y-1 text-slate-700 border border-slate-200">
                    <div><strong>From:</strong> {org?.name || "Assay Biz"} &lt;{org?.email || "support@aassaybiz.com"}&gt;</div>
                    <div>
                      <strong>Subject:</strong>{" "}
                      {activePreview.trigger_event === "deal_won"
                        ? `🎉 Congratulations & Welcome to ${org?.name || "Assay Biz"}! Deal Confirmed: ${sampleDeal.title}`
                        : `Welcome to ${org?.name || "Assay Biz"}, ${sampleLead.name}!`}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <iframe
                      title="Email Preview"
                      srcDoc={
                        activePreview.trigger_event === "deal_won"
                          ? getDealWonEmailHtml(org, sampleDeal, sampleRecipient)
                          : getLeadWelcomeEmailHtml(org, sampleLead)
                      }
                      className="w-full h-[450px] border-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>This WhatsApp message is delivered directly to the client's verified mobile number.</span>
                  </div>

                  {/* WhatsApp Chat Bubble Simulation */}
                  <div className="bg-[#efeae2] p-6 rounded-2xl border border-slate-200 shadow-inner">
                    <div className="max-w-md ml-auto bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-sm p-4 shadow-sm text-sm space-y-2 relative border border-[#c4eabf]">
                      <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                        {activePreview.trigger_event === "deal_won"
                          ? getDealWonWhatsappText(org, sampleDeal, sampleRecipient)
                          : getLeadWelcomeWhatsappText(org, sampleLead)}
                      </div>
                      <div className="text-[10px] text-slate-500 text-right font-mono flex items-center justify-end gap-1 pt-1">
                        <span>10:30 AM</span>
                        <CheckCircle2 className="w-3 h-3 text-blue-500 inline" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
