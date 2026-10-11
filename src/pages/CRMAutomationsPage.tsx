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
  Sparkles,
  PhoneCall,
  Clock,
  Bell,
  AlertCircle,
  UserCheck,
  CheckSquare
} from "lucide-react";
import { toast } from "sonner";
import {
  getDealWonEmailHtml,
  getDealWonWhatsappText,
  getLeadWelcomeEmailHtml,
  getLeadWelcomeWhatsappText,
  getTaskDueEmailHtml,
  getTaskDueWhatsappText,
  getTaskCustomReminderEmailHtml,
  getTaskCustomReminderWhatsappText,
} from "@/lib/crm-automations";

interface PresetAutomation {
  id: string;
  name: string;
  category: "email" | "whatsapp";
  group: "deals_leads" | "tasks";
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
  const [filterGroup, setFilterGroup] = useState<"all" | "deals_leads" | "tasks">("all");
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
          is_active: !current,
        })
        .select()
        .single();

      if (!error && data) {
        setAutomations([...automations, data]);
        toast.success(!current ? "Automation enabled" : "Automation disabled");
      }
    }
  };

  const isEnabled = (trigger: string, action: string) => {
    const found = automations.find((a) => a.trigger_event === trigger && a.action_type === action);
    if (found) return found.is_active;
    // Default to active for built-in preset automations
    return true;
  };

  const presets: PresetAutomation[] = [
    {
      id: "deal-won-email",
      name: "Deal Won Client Onboarding & Thank You Email",
      category: "email",
      group: "deals_leads",
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
      group: "deals_leads",
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
      group: "deals_leads",
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
      group: "deals_leads",
      description: "Automatically trigger a warm, instant greeting WhatsApp message when a new lead is captured with a valid phone number.",
      trigger_event: "lead_created",
      action_type: "send_whatsapp",
      icon: <MessageSquare className="w-5 h-5 text-emerald-500" />,
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    },
    {
      id: "task-due-whatsapp",
      name: "Sales Executive Task Due Reminder (WhatsApp)",
      category: "whatsapp",
      group: "tasks",
      description: "Automatically dispatch an instant WhatsApp notification to the assigned sales executive when their scheduled CRM task reaches or approaches its due deadline.",
      trigger_event: "task_due",
      action_type: "send_task_due_whatsapp",
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      badgeColor: "bg-blue-500/10 text-blue-700 border-blue-200",
    },
    {
      id: "task-due-email",
      name: "Sales Executive Task Due Reminder (Email)",
      category: "email",
      group: "tasks",
      description: "Automatically send a high-priority branded email alert to the assigned sales executive when their task reaches its due deadline, detailing all lead notes and urgency.",
      trigger_event: "task_due",
      action_type: "send_task_due_email",
      icon: <AlertCircle className="w-5 h-5 text-indigo-600" />,
      badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
    },
    {
      id: "task-custom-reminder-whatsapp",
      name: "Sales Executive Custom Reminder Alert (WhatsApp)",
      category: "whatsapp",
      group: "tasks",
      description: "Automatically dispatch a personalized WhatsApp reminder to the assigned sales executive at their exact scheduled custom reminder date & time, auto-capturing all updated task fields.",
      trigger_event: "task_custom_reminder",
      action_type: "send_custom_reminder_whatsapp",
      icon: <Bell className="w-5 h-5 text-teal-600" />,
      badgeColor: "bg-teal-500/10 text-teal-700 border-teal-200",
    },
    {
      id: "task-custom-reminder-email",
      name: "Sales Executive Custom Reminder Alert (Email)",
      category: "email",
      group: "tasks",
      description: "Automatically trigger a branded notification email to the assigned sales executive at their custom scheduled reminder time with complete lead, task, priority, and due details.",
      trigger_event: "task_custom_reminder",
      action_type: "send_custom_reminder_email",
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200",
    },
  ];

  const filteredPresets = presets.filter((p) => {
    if (filterGroup === "all") return true;
    return p.group === filterGroup;
  });

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

  const sampleTask = {
    subject: "Product Demo & Commercial Proposal Review",
    body: "Demonstrate enterprise dashboard features, answer GST multi-branch compliance questions, and finalize invoice terms.",
    activity_type: "Site Visit / Field Visit",
    priority: "Urgent",
    due_at: new Date(Date.now() + 7200000).toISOString(),
    custom_reminder_at: new Date(Date.now() + 3600000).toISOString(),
    reminder_type: `custom:${new Date(Date.now() + 3600000).toISOString()}`,
    status: "Pending",
    leadName: "Rajesh Gupta",
    leadCompany: "Apex Technologies Pvt Ltd",
    dealTitle: "Enterprise Annual Cloud Subscription",
  };

  const sampleAssignee = {
    name: "Vikram Sharma",
    role: "Senior Sales Executive",
    email: "vikram.sales@example.com",
    phone: "9876543210",
  };

  const activeCount = presets.filter((p) => isEnabled(p.trigger_event, p.action_type)).length;

  return (
    <>
      <div className="flex-1 space-y-6 p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto h-[calc(100vh-4rem)]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-200/50 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-400">
                  Automations & Workflows
                </h1>
                <p className="text-muted-foreground mt-0.5 text-xs lg:text-sm">
                  Supercharge your sales cycle with automated, personalized WhatsApp and Email communication for deals, leads, and sales executive task reminders.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm border-slate-200 dark:border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              {activeCount} of {presets.length} Active
            </Badge>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Button
            variant={filterGroup === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGroup("all")}
            className="text-xs h-8"
          >
            All Automations ({presets.length})
          </Button>
          <Button
            variant={filterGroup === "tasks" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGroup("tasks")}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-blue-500" />
            <span>Task & Due Reminders (4)</span>
          </Button>
          <Button
            variant={filterGroup === "deals_leads" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterGroup("deals_leads")}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Deals & Leads (4)</span>
          </Button>
        </div>

        {/* Workflow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPresets.map((preset) => {
            const active = isEnabled(preset.trigger_event, preset.action_type);
            return (
              <Card
                key={preset.id}
                className={`border transition-all duration-200 rounded-2xl relative overflow-hidden shadow-sm hover:shadow-md ${
                  active ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" : "border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 opacity-90"
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
                  <div className="flex items-center gap-3 mb-2 flex-wrap pr-12">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700 shadow-inner">
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
                    <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-800">
                      {preset.group === "tasks" ? "Sales Team Tasks" : "Customer Communication"}
                    </Badge>
                    {active ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-slate-400">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                    {preset.name}
                  </CardTitle>
                  <CardDescription className="text-sm pt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                    {preset.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 truncate">
                      <Workflow className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong>Trigger:</strong> <code className="bg-slate-200/60 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">{preset.trigger_event}</code></span>
                      <span className="text-slate-300">→</span>
                      <span><strong>Action:</strong> <code className="bg-slate-200/60 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">{preset.action_type}</code></span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPreview(preset)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 h-7 gap-1 shrink-0 font-medium"
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
              <span className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
                {activePreview?.category === "email" ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
              </span>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {activePreview?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {activePreview?.group === "tasks"
                    ? "Live preview of the automated alert dispatched to the assigned sales executive."
                    : "Live preview of the message dispatched to the customer when triggered."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {activePreview && (
            <div className="py-2">
              {activePreview.category === "email" ? (
                <div className="space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <div><strong>From:</strong> {org?.name || "Assay Biz"} &lt;{org?.email || "support@aassaybiz.com"}&gt;</div>
                    <div>
                      <strong>To:</strong>{" "}
                      {activePreview.group === "tasks"
                        ? `${sampleAssignee.name} <${sampleAssignee.email}> (Assigned Executive)`
                        : `${sampleLead.name} <${sampleLead.email}>`}
                    </div>
                    <div>
                      <strong>Subject:</strong>{" "}
                      {activePreview.trigger_event === "deal_won"
                        ? `🎉 Congratulations & Welcome to ${org?.name || "Assay Biz"}! Deal Confirmed: ${sampleDeal.title}`
                        : activePreview.trigger_event === "task_due"
                        ? `⏰ Task Due Reminder: ${sampleTask.subject} (${sampleTask.priority} Priority)`
                        : activePreview.trigger_event === "task_custom_reminder"
                        ? `🔔 Custom Task Reminder: ${sampleTask.subject} (${sampleTask.priority} Priority)`
                        : `Welcome to ${org?.name || "Assay Biz"}, ${sampleLead.name}!`}
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white">
                    <iframe
                      title="Email Preview"
                      srcDoc={
                        activePreview.trigger_event === "deal_won"
                          ? getDealWonEmailHtml(org, sampleDeal, sampleRecipient)
                          : activePreview.trigger_event === "task_due"
                          ? getTaskDueEmailHtml(org, sampleTask, sampleAssignee)
                          : activePreview.trigger_event === "task_custom_reminder"
                          ? getTaskCustomReminderEmailHtml(org, sampleTask, sampleAssignee)
                          : getLeadWelcomeEmailHtml(org, sampleLead)
                      }
                      className="w-full h-[450px] border-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {activePreview.group === "tasks"
                        ? `This WhatsApp reminder is delivered directly to ${sampleAssignee.name}'s verified mobile number (${sampleAssignee.phone}).`
                        : "This WhatsApp message is delivered directly to the client's verified mobile number."}
                    </span>
                  </div>

                  {/* WhatsApp Chat Bubble Simulation */}
                  <div className="bg-[#efeae2] dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    <div className="max-w-md ml-auto bg-[#d9fdd3] dark:bg-emerald-950/60 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tr-sm p-4 shadow-sm text-sm space-y-2 relative border border-[#c4eabf] dark:border-emerald-800/80">
                      <div className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                        {activePreview.trigger_event === "deal_won"
                          ? getDealWonWhatsappText(org, sampleDeal, sampleRecipient)
                          : activePreview.trigger_event === "task_due"
                          ? getTaskDueWhatsappText(org, sampleTask, sampleAssignee)
                          : activePreview.trigger_event === "task_custom_reminder"
                          ? getTaskCustomReminderWhatsappText(org, sampleTask, sampleAssignee)
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
