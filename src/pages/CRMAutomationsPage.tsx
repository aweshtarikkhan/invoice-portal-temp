import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  CheckSquare,
  Plus,
  Trash2,
  Flame,
  UserPlus,
  Tag,
  ArrowRight,
  RotateCcw,
  Check
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
  DEFAULT_LEAD_STATUSES,
  fetchOrgLeadStatuses,
  saveOrgLeadStatuses,
  LeadStatusItem,
  fetchLeadSourceRules,
  saveLeadSourcePriorityRules,
  saveLeadSourceAssignmentRules,
  LeadSourcePriorityRule,
  LeadSourceAssignmentRule,
  ensureAdminInCrmTeam
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

const COLOR_PRESETS = [
  { name: "Blue", class: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Emerald", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Amber", class: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Purple", class: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "Rose", class: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "Indigo", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { name: "Cyan", class: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  { name: "Orange", class: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "Slate", class: "bg-slate-100 text-slate-700 border-slate-300" },
];

const COMMON_SOURCES = [
  "Justdial",
  "IndiaMART",
  "Website",
  "Facebook",
  "Google Ads",
  "Instagram",
  "Referral",
  "Walk-in",
  "Cold Call",
  "Direct Call",
  "LinkedIn",
  "Trade Show",
  "Other"
];

export default function CRMAutomationsPage() {
  const org = useAppStore((s) => s.organization);
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<string>("email_whatsapp");
  const [filterGroup, setFilterGroup] = useState<"all" | "deals_leads" | "tasks">("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activePreview, setActivePreview] = useState<PresetAutomation | null>(null);

  // Lead Automations State
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusItem[]>(DEFAULT_LEAD_STATUSES);
  const [newStatusOpen, setNewStatusOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(COLOR_PRESETS[0].class);

  // Action Logged Auto Status Change State
  const [actionLoggedActive, setActionLoggedActive] = useState(true);
  const [actionLoggedFrom, setActionLoggedFrom] = useState("new");
  const [actionLoggedTarget, setActionLoggedTarget] = useState("follow_up");

  // Priority Source Rules State
  const [priorityActive, setPriorityActive] = useState(false);
  const [priorityRules, setPriorityRules] = useState<LeadSourcePriorityRule[]>([]);
  const [newPriSource, setNewPriSource] = useState("Justdial");
  const [newPriCustomSource, setNewPriCustomSource] = useState("");
  const [newPriLevel, setNewPriLevel] = useState<"hot" | "warm" | "cold">("hot");

  // Auto Assignment Rules State
  const [assignActive, setAssignActive] = useState(false);
  const [assignRules, setAssignRules] = useState<LeadSourceAssignmentRule[]>([]);
  const [newAssignSource, setNewAssignSource] = useState("Justdial");
  const [newAssignCustomSource, setNewAssignCustomSource] = useState("");
  const [newAssignMemberId, setNewAssignMemberId] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (org?.id) {
      fetchAutomations();
      loadLeadAutomationsData();
    }
  }, [org?.id]);

  const fetchAutomations = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("crm_automations")
      .select("*")
      .eq("org_id", org!.id);

    if (data) {
      setAutomations(data);
      // Check action logged automation
      const actionRow = data.find((a: any) => a.trigger_event === "action_logged_status_update");
      if (actionRow) {
        setActionLoggedActive(actionRow.is_active);
        if (actionRow.config?.from_status) setActionLoggedFrom(actionRow.config.from_status);
        if (actionRow.config?.target_status) setActionLoggedTarget(actionRow.config.target_status);
      }
    }
    setLoading(false);
  };

  const loadLeadAutomationsData = async () => {
    if (!org?.id) return;
    try {
      // Ensure admin is in CRM team
      await ensureAdminInCrmTeam(org.id, null, org.email || undefined);

      // Load Lead Statuses
      const rawStatuses = await fetchOrgLeadStatuses(org.id);
      const statuses = (rawStatuses && rawStatuses.length > 0 ? rawStatuses : DEFAULT_LEAD_STATUSES).map((s, idx) => {
        const v = s?.v || s?.value || `status_${idx}`;
        const l = s?.l || s?.label || (v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ") : `Status ${idx + 1}`);
        const cls = s?.cls || s?.color || "bg-slate-100 text-slate-700 border-slate-300";
        return { v, l, cls, value: v, label: l, color: cls };
      });
      setLeadStatuses(statuses);

      // Load Team Members
      const { data: teamData } = await (supabase as any)
        .from("crm_team")
        .select("*")
        .eq("org_id", org.id)
        .order("name");
      if (teamData && teamData.length > 0) {
        setTeamMembers(teamData);
        setNewAssignMemberId(teamData[0].id);
      }

      // Load Source Rules
      const rules = await fetchLeadSourceRules(org.id);
      setPriorityActive(rules.priorityActive);
      setPriorityRules(rules.priorityRules || []);
      setAssignActive(rules.assignmentActive);
      setAssignRules(rules.assignmentRules || []);
    } catch (e) {
      console.error("Error loading lead automations data:", e);
    }
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
    return true;
  };

  // 1. Status Handlers
  const handleAddStatus = async () => {
    const trimmed = newStatusLabel.trim();
    if (!trimmed) {
      toast.error("Please enter a status label");
      return;
    }
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (leadStatuses.some((s) => (s.v || s.value) === slug)) {
      toast.error("A status with this name already exists");
      return;
    }

    const newStatus: LeadStatusItem = {
      v: slug,
      l: trimmed,
      cls: newStatusColor,
      value: slug,
      label: trimmed,
      color: newStatusColor,
      is_default: false,
    };

    const updated = [...leadStatuses, newStatus];
    setLeadStatuses(updated);
    const ok = await saveOrgLeadStatuses(org!.id, updated);
    if (ok) {
      toast.success(`Status "${trimmed}" created successfully!`);
      setNewStatusOpen(false);
      setNewStatusLabel("");
    } else {
      toast.error("Failed to save status");
    }
  };

  const handleDeleteStatus = async (statusVal: string) => {
    if (leadStatuses.length <= 1) {
      toast.error("You must have at least one lead status");
      return;
    }
    const target = leadStatuses.find((s) => (s.v || s.value) === statusVal);
    const updated = leadStatuses.filter((s) => (s.v || s.value) !== statusVal);
    setLeadStatuses(updated);
    const ok = await saveOrgLeadStatuses(org!.id, updated);
    if (ok) {
      toast.success(`Status "${target?.l || target?.label || statusVal}" removed`);
    } else {
      toast.error("Failed to update statuses");
    }
  };

  const handleResetStatuses = async () => {
    const defaults = DEFAULT_LEAD_STATUSES.map((s) => ({
      ...s,
      value: s.v,
      label: s.l,
      color: s.cls,
    }));
    setLeadStatuses(defaults);
    const ok = await saveOrgLeadStatuses(org!.id, defaults);
    if (ok) {
      toast.success("Lead statuses reset to CRM defaults");
    }
  };

  // 2. Action Logged Rule Handler
  const handleSaveActionLoggedRule = async (newActive?: boolean, newFrom?: string, newTarget?: string) => {
    const active = newActive !== undefined ? newActive : actionLoggedActive;
    const from = newFrom || actionLoggedFrom;
    const target = newTarget || actionLoggedTarget;

    const existing = automations.find((a) => a.trigger_event === "action_logged_status_update");
    if (existing) {
      const { error } = await (supabase as any)
        .from("crm_automations")
        .update({
          is_active: active,
          config: { from_status: from, target_status: target },
        })
        .eq("id", existing.id);

      if (!error) {
        setActionLoggedActive(active);
        setActionLoggedFrom(from);
        setActionLoggedTarget(target);
        toast.success("Activity status automation updated");
      }
    } else {
      const { data, error } = await (supabase as any)
        .from("crm_automations")
        .insert({
          org_id: org!.id,
          name: "Update Lead Status on Activity Logged",
          trigger_event: "action_logged_status_update",
          action_type: "change_lead_status",
          is_active: active,
          config: { from_status: from, target_status: target },
        })
        .select()
        .single();

      if (!error && data) {
        setAutomations([...automations, data]);
        setActionLoggedActive(active);
        setActionLoggedFrom(from);
        setActionLoggedTarget(target);
        toast.success("Activity status automation enabled");
      }
    }
  };

  // 3. Priority Rules Handlers
  const handleTogglePriorityAutomation = async (active: boolean) => {
    setPriorityActive(active);
    await saveLeadSourcePriorityRules(org!.id, active, priorityRules);
    toast.success(active ? "Source priority automation enabled" : "Source priority automation disabled");
  };

  const handleAddPriorityRule = async () => {
    const sourceName = newPriSource === "Other" ? newPriCustomSource.trim() : newPriSource;
    if (!sourceName) {
      toast.error("Please provide a source name");
      return;
    }
    const filtered = priorityRules.filter((r) => r.source.toLowerCase() !== sourceName.toLowerCase());
    const updated = [...filtered, { source: sourceName, priority: newPriLevel }];
    setPriorityRules(updated);
    await saveLeadSourcePriorityRules(org!.id, priorityActive, updated);
    toast.success(`Priority rule for ${sourceName} added`);
    setNewPriCustomSource("");
  };

  const handleRemovePriorityRule = async (sourceName: string) => {
    const updated = priorityRules.filter((r) => r.source.toLowerCase() !== sourceName.toLowerCase());
    setPriorityRules(updated);
    await saveLeadSourcePriorityRules(org!.id, priorityActive, updated);
    toast.success(`Rule for ${sourceName} removed`);
  };

  // 4. Assignment Rules Handlers
  const handleToggleAssignAutomation = async (active: boolean) => {
    setAssignActive(active);
    await saveLeadSourceAssignmentRules(org!.id, active, assignRules);
    toast.success(active ? "Auto-assignment automation enabled" : "Auto-assignment automation disabled");
  };

  const handleAddAssignRule = async () => {
    const sourceName = newAssignSource === "Other" ? newAssignCustomSource.trim() : newAssignSource;
    if (!sourceName) {
      toast.error("Please provide a source name");
      return;
    }
    if (!newAssignMemberId) {
      toast.error("Please select a sales team member");
      return;
    }
    const member = teamMembers.find((m) => m.id === newAssignMemberId);
    const filtered = assignRules.filter((r) => r.source.toLowerCase() !== sourceName.toLowerCase());
    const updated = [
      ...filtered,
      { source: sourceName, member_id: newAssignMemberId, member_name: member?.name || "Rep" },
    ];
    setAssignRules(updated);
    await saveLeadSourceAssignmentRules(org!.id, assignActive, updated);
    toast.success(`Auto-assignment rule for ${sourceName} added`);
    setNewAssignCustomSource("");
  };

  const handleRemoveAssignRule = async (sourceName: string) => {
    const updated = assignRules.filter((r) => r.source.toLowerCase() !== sourceName.toLowerCase());
    setAssignRules(updated);
    await saveLeadSourceAssignmentRules(org!.id, assignActive, updated);
    toast.success(`Assignment rule for ${sourceName} removed`);
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
      description: "Automatically dispatch a personalized WhatsApp reminder to the assigned sales executive at their exact scheduled custom reminder date & time.",
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
                  CRM Automations & Workflows
                </h1>
                <p className="text-muted-foreground mt-0.5 text-xs lg:text-sm">
                  Automate client communication, customize lead stages, and streamline lead qualification rules.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm border-slate-200 dark:border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
              {activeCount} Alert Workflows Active
            </Badge>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="grid w-full sm:w-[500px] grid-cols-2 mb-6 h-11 p-1 bg-slate-200/60 dark:bg-slate-800">
            <TabsTrigger value="email_whatsapp" className="flex items-center gap-2 text-xs font-semibold">
              <Mail className="w-4 h-4 text-primary" />
              Email & WhatsApp Alerts
            </TabsTrigger>
            <TabsTrigger value="lead_automations" className="flex items-center gap-2 text-xs font-semibold">
              <Workflow className="w-4 h-4 text-emerald-600" />
              Lead Automations & Statuses
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: EMAIL & WHATSAPP ALERTS */}
          <TabsContent value="email_whatsapp" className="space-y-6">
            {/* Filter Pills */}
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
          </TabsContent>

          {/* TAB 2: LEAD AUTOMATIONS & CUSTOM STATUSES */}
          <TabsContent value="lead_automations" className="space-y-6">
            
            {/* 1. Custom Lead Statuses Manager */}
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-600" />
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      Custom Lead Statuses
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {leadStatuses.length} Statuses
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground mt-1">
                    Manage the sales pipeline statuses for your organization. You can create custom statuses, assign color tags, or delete unwanted ones.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetStatuses}
                    className="h-8 text-xs gap-1.5 text-slate-600 dark:text-slate-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Defaults
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setNewStatusOpen(true)}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create Status
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
                  {leadStatuses.map((st, idx) => {
                    const val = st.v || st.value || `status_${idx}`;
                    const label = st.l || st.label || (val ? val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, " ") : `Status ${idx + 1}`);
                    const badgeColor = st.cls || st.color || "bg-slate-100 text-slate-700 border-slate-300";
                    return (
                      <div
                        key={val}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
                            {label}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate">
                            ({val})
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStatus(val)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
                          title="Delete status"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 2. On Action Logged Status Update Rule */}
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-200 flex items-center justify-center shrink-0">
                    <Workflow className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Auto-Update Status on Activity / Action
                      {actionLoggedActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Whenever any activity (Call, Meeting, Note, Follow-up) is logged on a lead in a designated status, automatically advance the lead to your chosen status.
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={actionLoggedActive}
                  onCheckedChange={(val) => handleSaveActionLoggedRule(val)}
                />
              </CardHeader>
              <CardContent className="pt-2">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-full sm:w-1/2 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        When Lead Status is:
                      </Label>
                      <Select
                        value={actionLoggedFrom}
                        onValueChange={(val) => handleSaveActionLoggedRule(undefined, val, undefined)}
                      >
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-900 text-xs font-medium">
                          <SelectValue placeholder="Select trigger status" />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses.map((s, idx) => {
                            const val = s.v || s.value || `status_${idx}`;
                            const label = s.l || s.label || (val ? val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, " ") : `Status ${idx + 1}`);
                            return (
                              <SelectItem key={val} value={val}>
                                {label} ({val})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="hidden sm:flex items-center justify-center pt-5">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="w-full sm:w-1/2 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Automatically Change Status To:
                      </Label>
                      <Select
                        value={actionLoggedTarget}
                        onValueChange={(val) => handleSaveActionLoggedRule(undefined, undefined, val)}
                      >
                        <SelectTrigger className="h-9 bg-white dark:bg-slate-900 text-xs font-medium">
                          <SelectValue placeholder="Select destination status" />
                        </SelectTrigger>
                        <SelectContent>
                          {leadStatuses.map((s, idx) => {
                            const val = s.v || s.value || `status_${idx}`;
                            const label = s.l || s.label || (val ? val.charAt(0).toUpperCase() + val.slice(1).replace(/_/g, " ") : `Status ${idx + 1}`);
                            return (
                              <SelectItem key={val} value={val}>
                                {label} ({val})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Whenever an executive logs an action via the Leads table or Lead Details page, this rule triggers instantaneously.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Source-Based Priority Automation */}
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-200 flex items-center justify-center shrink-0">
                    <Flame className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Auto-Set Priority by Lead Source
                      {priorityActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Automatically tag newly captured leads as Hot, Warm, or Cold based on their acquisition channel (e.g. Justdial leads automatically set to Hot).
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={priorityActive}
                  onCheckedChange={handleTogglePriorityAutomation}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Rules List */}
                <div className="space-y-2">
                  {priorityRules.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-muted-foreground">
                      No source priority rules configured yet. Add your first rule below.
                    </div>
                  ) : (
                    priorityRules.map((r) => (
                      <div
                        key={r.source}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {r.source}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <Badge
                            className={`text-xs capitalize ${
                              r.priority === "hot"
                                ? "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100"
                                : r.priority === "warm"
                                ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
                            }`}
                          >
                            {r.priority} Priority
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePriorityRule(r.source)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Rule Form */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-1/3">
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Lead Source</Label>
                    <Select value={newPriSource} onValueChange={setNewPriSource}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newPriSource === "Other" && (
                    <div className="w-full sm:w-1/3">
                      <Label className="text-[11px] text-muted-foreground mb-1 block">Custom Source Name</Label>
                      <Input
                        placeholder="e.g. Newspaper Ad"
                        value={newPriCustomSource}
                        onChange={(e) => setNewPriCustomSource(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}

                  <div className="w-full sm:w-1/3">
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Target Priority</Label>
                    <Select value={newPriLevel} onValueChange={(val: any) => setNewPriLevel(val)}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">🔥 Hot Priority</SelectItem>
                        <SelectItem value="warm">⚡ Warm Priority</SelectItem>
                        <SelectItem value="cold">❄️ Cold Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto pt-4 sm:pt-4">
                    <Button
                      size="sm"
                      onClick={handleAddPriorityRule}
                      className="h-8 text-xs gap-1.5 w-full sm:w-auto bg-primary text-primary-foreground"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Priority Rule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Source-Based Lead Auto-Assignment */}
            <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-200 flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Auto-Assign Rep by Lead Source
                      {assignActive ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Direct leads from specific channels straight to chosen sales representatives or sales managers (e.g. Justdial leads assigned to Sumit).
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={assignActive}
                  onCheckedChange={handleToggleAssignAutomation}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Rules List */}
                <div className="space-y-2">
                  {assignRules.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-muted-foreground">
                      No auto-assignment rules configured yet. Select a source and sales rep below.
                    </div>
                  ) : (
                    assignRules.map((r) => (
                      <div
                        key={r.source}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {r.source}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            {r.member_name || "Sales Rep"}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAssignRule(r.source)}
                          className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Rule Form */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-1/3">
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Lead Source</Label>
                    <Select value={newAssignSource} onValueChange={setNewAssignSource}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newAssignSource === "Other" && (
                    <div className="w-full sm:w-1/3">
                      <Label className="text-[11px] text-muted-foreground mb-1 block">Custom Source Name</Label>
                      <Input
                        placeholder="e.g. Local Event"
                        value={newAssignCustomSource}
                        onChange={(e) => setNewAssignCustomSource(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                      />
                    </div>
                  )}

                  <div className="w-full sm:w-1/3">
                    <Label className="text-[11px] text-muted-foreground mb-1 block">Assign To Sales Rep</Label>
                    <Select value={newAssignMemberId} onValueChange={setNewAssignMemberId}>
                      <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Select sales rep" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-auto pt-4 sm:pt-4">
                    <Button
                      size="sm"
                      onClick={handleAddAssignRule}
                      className="h-8 text-xs gap-1.5 w-full sm:w-auto bg-primary text-primary-foreground"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Assignment Rule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      </div>

      {/* Create Custom Status Modal */}
      <Dialog open={newStatusOpen} onOpenChange={setNewStatusOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Custom Lead Status</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new status stage for your leads and choose a badge color.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Status Name</Label>
              <Input
                placeholder="e.g. Demo Scheduled, Quotation Sent"
                value={newStatusLabel}
                onChange={(e) => setNewStatusLabel(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Badge Color Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setNewStatusColor(c.class)}
                    className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${c.class} ${
                      newStatusColor === c.class ? "ring-2 ring-primary ring-offset-1" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <span>{c.name}</span>
                    {newStatusColor === c.class && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800 text-xs flex items-center justify-between">
              <span className="text-muted-foreground">Preview:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${newStatusColor}`}>
                {newStatusLabel || "Preview Label"}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setNewStatusOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddStatus}>
              Save Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                      className="w-full h-[480px] border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <div><strong>Recipient Phone:</strong> +91 {sampleLead.phone}</div>
                    <div><strong>Channel:</strong> WhatsApp Business Direct Notification</div>
                    <span className="text-[11px] text-muted-foreground block pt-0.5">
                      {activePreview.group === "tasks"
                        ? "This WhatsApp message is delivered directly to the assigned sales executive's verified mobile number."
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
