import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { hasModuleAccess, hasUnlimitedLeads, getLeadLimit, normalizePlanKey, FREE_PLAN_LIMITS } from "@/lib/subscription";
import { LockedFeature } from "@/components/subscription/LockedFeature";
import { LimitReachedAlert } from "@/components/shared/LimitReachedAlert";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { Plus, Pencil, Trash2, ArrowRightCircle, Search, Users, TrendingUp, Target, IndianRupee, Flame, Snowflake, Sun, Phone, Mail, Eye, Upload, Sparkles, AlertCircle, AlertTriangle, UserCheck, UserPlus, MoreVertical, Calendar as CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { ImportDialog, ImportField } from "@/components/shared/ImportDialog";
import { AutoFitNumber } from "@/components/shared/AutoFitNumber";
import { buildBrandedEmailHtml } from "@/lib/brand-email-template";
import {
  triggerLeadCreatedAutomations,
  fetchOrgLeadStatuses,
  ensureAdminInCrmTeam,
  DEFAULT_LEAD_STATUSES,
  LeadStatusItem,
  fetchLeadSourceRules,
} from "@/lib/crm-automations";
import { LeadActivityModal } from "@/components/crm/LeadActivityModal";

const leadImportFields: ImportField[] = [
  { key: "name", label: "Lead Name", required: true },
  { key: "company", label: "Company" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "estimated_value", label: "Estimated Value" },
  { key: "notes", label: "Notes" },
  { key: "tags", label: "Tags" },
];

const STATUSES = [
  { v: "new", l: "New", cls: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600" },
  { v: "contacted", l: "Contacted", cls: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700" },
  { v: "qualified", l: "Qualified", cls: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700" },
  { v: "converted", l: "Converted", cls: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700" },
  { v: "lost", l: "Lost", cls: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700" },
];

const PRIORITIES = [
  { v: "hot", l: "Hot", cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700", icon: Flame },
  { v: "warm", l: "Warm", cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700", icon: Sun },
  { v: "cold", l: "Cold", cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700", icon: Snowflake },
];

const LEAD_SOURCES = ["Website", "Referral", "Social Media", "Cold Call", "Advertisement", "Other"];


const normalizeLeadPriority = (val: any): "hot" | "warm" | "cold" => {
  if (!val) return "warm";
  const s = String(typeof val === "object" ? (val.text || val.value || "") : val).toLowerCase().trim();
  if (s.includes("hot") || s.includes("high") || s.includes("urgent") || s.includes("critical")) return "hot";
  if (s.includes("cold") || s.includes("low") || s.includes("minor")) return "cold";
  return "warm";
};

const normalizeLeadStatus = (val: any): "new" | "contacted" | "qualified" | "converted" | "lost" => {
  if (!val) return "new";
  const s = String(typeof val === "object" ? (val.text || val.value || "") : val).toLowerCase().trim();
  if (s.includes("won") || s.includes("convert") || s.includes("deal") || s.includes("client")) return "converted";
  if (s.includes("qualif") || s.includes("negotiat") || s.includes("proposal") || s.includes("review") || s.includes("pitch")) return "qualified";
  if (s.includes("contact") || s.includes("demo") || s.includes("call") || s.includes("progress") || s.includes("outreach") || s.includes("meeting")) return "contacted";
  if (s.includes("lost") || s.includes("drop") || s.includes("reject") || s.includes("junk")) return "lost";
  return "new";
};

const parseLeadValue = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const str = String(typeof val === "object" ? (val.text || val.value || val.result || "") : val);
  const clean = str.replace(/[^0-9.-]+/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const cleanLeadField = (val: any): string | null => {
  if (val == null) return null;
  let str = "";
  if (typeof val === "object") {
    if (val.text != null) str = String(val.text);
    else if (val.value != null) str = String(val.value);
    else if (val.result != null) str = String(val.result);
    else if (val.hyperlink != null) str = String(val.text || val.hyperlink).replace(/^tel:/i, "").replace(/^mailto:/i, "");
    else if (Array.isArray(val.richText)) str = val.richText.map((rt: any) => (rt && rt.text) || "").join("");
    else str = String(val);
  } else {
    str = String(val);
  }
  str = String(str).trim();
  if (str === "[object Object]" || str === "undefined" || str === "null" || !str) return null;
  return str;
};

const emptyForm = { name: "", company: "", email: "", phone: "", source: "", status: "new", estimated_value: "0", notes: "", tags: "", priority: "warm", owner_id: null };

export default function LeadsPage() {
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currency = (org as any)?.currency_code || "INR";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (searchParams.get("view") === "followups") return "followup";
    return searchParams.get("status") || "all";
  });
  const [followUpLeadIds, setFollowUpLeadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const viewParam = searchParams.get("view");
    if (viewParam === "followups") {
      setStatusFilter("followup");
    } else if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Dynamic Lead Statuses & Action Modal
  const [leadStatuses, setLeadStatuses] = useState<LeadStatusItem[]>(DEFAULT_LEAD_STATUSES);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedLeadForAction, setSelectedLeadForAction] = useState<any>(null);

  const { subscriptionPlan } = useSubscription();
  const plan = subscriptionPlan || org?.subscription_plan || "free";
  const [activeOrgPlans, setActiveOrgPlans] = useState<string[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  // Business Suite and Business CRM have unlimited leads; all other plans are capped at 50
  const isUnlimited = useMemo(() => {
    return hasUnlimitedLeads(plan, activeOrgPlans);
  }, [plan, activeOrgPlans]);

  const limitReached = !isUnlimited && rows.length >= 50;

  const handleAddLeadClick = () => {
    if (limitReached) {
      setShowLimitAlert(true);
    } else {
      setForm(emptyForm);
      setEditId(null);
      setOpen(true);
    }
  };
  const [form, setForm] = useState<any>(emptyForm);
  const [addExecutiveOpen, setAddExecutiveOpen] = useState(false);

  const handleQuickAddExecutive = async () => {
    if (!org?.id || !newTeamMemberName.trim()) return;
    try {
      const { data, error } = await supabase
        .from("crm_team")
        .insert({ org_id: org.id, name: newTeamMemberName.trim(), role: "Sales Executive", is_active: true })
        .select()
        .single();
      if (error) throw error;
      setCrmTeam(prev => [...prev, data]);
      setForm(f => ({ ...f, owner_id: data.id }));
      setAddExecutiveOpen(false);
      setNewTeamMemberName("");
      toast({ title: "Executive Added" });
    } catch (error: any) {
      toast({ title: "Error adding executive", description: error.message, variant: "destructive" });
    }
  };
  const [crmTeam, setCrmTeam] = useState<any[]>([]);
  const [newTeamMemberName, setNewTeamMemberName] = useState("");

  const updateLeadOwner = async (leadId: string, newOwnerId: string | null) => {
    try {
      const { error } = await (supabase as any)
        .from("leads")
        .update({ owner_id: newOwnerId })
        .eq("id", leadId);
      if (error) throw error;
      setRows(prev => prev.map(r => r.id === leadId ? { ...r, owner_id: newOwnerId } : r));
      const member = crmTeam.find(m => m.id === newOwnerId);
      toast({ title: newOwnerId ? `Assigned to ${member?.name || "Sales Executive"}` : "Lead unassigned" });
    } catch (err: any) {
      toast({ title: "Failed to update assignment", description: err.message, variant: "destructive" });
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);
      if (error) throw error;
      setRows(prev => prev.map(r => r.id === leadId ? { ...r, status: newStatus } : r));
      const statusObj = leadStatuses.find(s => s.v === newStatus);
      toast({ title: `Status updated to ${statusObj?.l || newStatus}` });
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  };

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      if (user) {
        await ensureAdminInCrmTeam(org.id, user);
      }
      const [{ data: leadsData, error: leadsErr }, { data: subsData }, { data: teamData }, statuses, { data: actsData }] = await Promise.all([
        (supabase as any).from("leads").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("plan_id, status").eq("org_id", org.id).eq("status", "active"),
        supabase.from("crm_team").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
        fetchOrgLeadStatuses(org.id),
        (supabase as any).from("activities").select("lead_id, status, completed_at, due_date, due_at, activity_type").eq("org_id", org.id),
      ]);
      if (leadsErr) toast({ title: "Load failed", description: leadsErr.message, variant: "destructive" });
      setRows(leadsData || []);
      if (actsData) {
        const fuIds = new Set<string>();
        const now = new Date();
        actsData.forEach((a: any) => {
          const isDone = a.completed_at || (a.status && a.status.toLowerCase() === "completed");
          if (!isDone && a.lead_id) {
            const dueDateStr = a.due_at || a.due_date;
            const isFollowUpType = (a.activity_type || "").toLowerCase().includes("follow");
            const isDue = dueDateStr ? new Date(dueDateStr) <= now : false;
            if (isFollowUpType || isDue) {
              fuIds.add(a.lead_id);
            }
          }
        });
        setFollowUpLeadIds(fuIds);
      }
      if (subsData && Array.isArray(subsData)) {
        setActiveOrgPlans(subsData.map((s: any) => s.plan_id));
      }
      setCrmTeam(teamData || []);
      if (statuses && statuses.length > 0) {
        setLeadStatuses(statuses);
      }
    } catch (e: any) {
      console.error("Failed to load leads or subscriptions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [org?.id]);

  const openNew = () => {
    if (limitReached) {
      setShowLimitAlert(true);
      return;
    }
    setEditId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({
      name: l.name, company: l.company || "", email: l.email || "", phone: l.phone || "",
      source: l.source || "", status: l.status, estimated_value: String(l.estimated_value || 0),
      notes: l.notes || "", tags: (l.tags || []).join(", "), priority: l.priority || "warm",
      owner_id: l.owner_id || null,
    });
    setOpen(true);
  };

  const [duplicateAlert, setDuplicateAlert] = useState<{
    isOpen: boolean;
    existingName: string;
    field: string;
    value: string;
  } | null>(null);

  const save = async (bypassDuplicateCheck = false) => {
    const cleanEmail = form.email?.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    const cleanPhone = form.phone?.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      toast({ title: "Invalid Mobile No.", description: "Mobile number must be exactly 10 digits.", variant: "destructive" });
      return;
    }
    if (!org?.id || !form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }

    // Case 26: Duplicate Entry Check
    if (!bypassDuplicateCheck) {
      const emailLower = cleanEmail?.toLowerCase();
      const dup = rows.find((r) => {
        if (editId && r.id === editId) return false;
        const rPhone = r.phone?.replace(/\D/g, "");
        const rEmail = r.email?.trim().toLowerCase();
        if (cleanPhone && rPhone && cleanPhone === rPhone) return true;
        if (emailLower && rEmail && emailLower === rEmail) return true;
        return false;
      });

      if (dup) {
        const isPhoneMatch = cleanPhone && dup.phone?.replace(/\D/g, "") === cleanPhone;
        const matchField = isPhoneMatch ? "Mobile Number" : "Email Address";
        const matchVal = isPhoneMatch ? form.phone : form.email;
        setDuplicateAlert({
          isOpen: true,
          existingName: dup.name || dup.company || "Existing Lead",
          field: matchField,
          value: matchVal || "",
        });
        return;
      }
    }

    // Enforce 50 leads cap for non-CRM / non-Suite plans
    if (!editId && !isUnlimited && rows.length >= 50) {
      setShowLimitAlert(true);
      toast({
        title: "Lead Limit Reached (50 Max)",
        description: "In this plan you can only add 50 leads maximum. Upgrade to Business Suite or add CRM to your existing plan for unlimited leads.",
        variant: "destructive"
      });
      return;
    }

    const payload: any = {
      org_id: org.id,
      name: form.name.trim(), company: form.company || null, email: cleanEmail || null, phone: cleanPhone || null,
      source: form.source || null, status: form.status,
      estimated_value: Number(form.estimated_value) || 0, notes: form.notes || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      priority: form.priority || "warm",
      owner_id: form.owner_id || null,
    };
    if (!editId && payload.source) {
      try {
        const rules = await fetchLeadSourceRules(org.id);
        if (rules.priorityActive && rules.priorityRules?.length > 0) {
          const matchPri = rules.priorityRules.find((r) => r.source.toLowerCase() === payload.source.toLowerCase());
          if (matchPri) {
            payload.priority = matchPri.priority;
          }
        }
        if (rules.assignmentActive && rules.assignmentRules?.length > 0 && !payload.owner_id) {
          const matchAss = rules.assignmentRules.find((r) => r.source.toLowerCase() === payload.source.toLowerCase());
          if (matchAss) {
            payload.owner_id = matchAss.member_id;
          }
        }
      } catch (e) {
        console.error("Error applying source automations:", e);
      }
    }

    const q = editId
      ? (supabase as any).from("leads").update(payload).eq("id", editId)
      : (supabase as any).from("leads").insert(payload);
    const { error } = await q;
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      setOpen(false);
      load();
      toast({ title: editId ? "Lead updated" : "Lead added" });
      
      // CRM Automations: Welcome Email & WhatsApp for New Leads
      if (!editId) {
        triggerLeadCreatedAutomations({ org, lead: payload });
      }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lead? Linked activities will also be removed.")) return;
    const { error } = await (supabase as any).from("leads").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const convertToClient = async (l: any) => {
    if (!org?.id) return;
    if (!confirm(`Convert "${l.name}" into a Client?`)) return;
    const { data: client, error } = await (supabase as any).from("clients").insert({
      org_id: org.id,
      display_name: l.name,
      first_name: l.name,
      company_name: l.company || null,
      email: l.email || null,
      phone: l.phone || null,
      mobile: l.phone || null,
      notes: `Converted from lead. ${l.notes || ""}`,
    }).select("*").single();
    if (error) { toast({ title: "Convert failed", description: error.message, variant: "destructive" }); return; }
    await (supabase as any).from("leads").update({ status: "converted", converted_client_id: client.id }).eq("id", l.id);
    toast({ title: "Converted to Client", description: client.display_name });
    load();
  };

  const filtered = rows.filter((r) => {
    if (statusFilter === "followup") {
      if (!followUpLeadIds.has(r.id)) return false;
    } else if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && (r.priority || "warm") !== priorityFilter) return false;
    if (ownerFilter !== "all") {
      if (ownerFilter === "unassigned" && r.owner_id) return false;
      if (ownerFilter !== "unassigned" && r.owner_id !== ownerFilter) return false;
    }

    // Date-wise filtering
    if (dateFilter !== "all" && r.created_at) {
      const leadDate = new Date(r.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        if (leadDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === "yesterday") {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        if (leadDate.toDateString() !== yest.toDateString()) return false;
      } else if (dateFilter === "last_7_days") {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        if (leadDate < d7) return false;
      } else if (dateFilter === "this_month") {
        if (leadDate.getMonth() !== now.getMonth() || leadDate.getFullYear() !== now.getFullYear()) return false;
      } else if (dateFilter === "last_month") {
        const lastM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        if (leadDate.getMonth() !== lastM.getMonth() || leadDate.getFullYear() !== lastM.getFullYear()) return false;
      } else if (dateFilter === "custom") {
        if (customStartDate && new Date(r.created_at) < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (new Date(r.created_at) > end) return false;
        }
      }
    }

    if (!search) return true;
    const s = search.toLowerCase();
    return (r.name?.toLowerCase().includes(s) || r.company?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || r.phone?.toLowerCase().includes(s));
  });

  const stats = useMemo(() => {
    const total = rows.length;
    const newThisMonth = rows.filter(r => {
      const d = new Date(r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const converted = rows.filter(r => r.status === "converted").length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";
    const pipelineValue = rows.filter(r => r.status !== "converted" && r.status !== "lost").reduce((s, r) => s + Number(r.estimated_value || 0), 0);
    const hotLeads = rows.filter(r => (r.priority || "warm") === "hot" && r.status !== "converted" && r.status !== "lost").length;
    return { total, newThisMonth, conversionRate, pipelineValue, hotLeads };
  }, [rows]);

  if (!hasModuleAccess(plan, "crm")) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <LockedFeature 
          title="CRM Module Locked"
          description="CRM and Lead Management features require the Business CRM or Business Suite plan."
          onUpgradeClick={() => setShowUpgrade(true)}
        />
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          currentPlanName={plan}
          forceOrgId={org?.id}
        />
      </div>
    );
  }

  const statusBadge = (s: string) => {
    const o = leadStatuses.find((x) => x.v === s) || STATUSES.find((x) => x.v === s) || { l: s, cls: "bg-slate-100 text-slate-800 border-slate-300" };
    return <Badge variant="outline" className={`${o.cls} text-xs font-semibold px-2 py-0.5`}>{o.l}</Badge>;
  };

  const priorityBadge = (p: string) => {
    const o = PRIORITIES.find((x) => x.v === (p || "warm")) || PRIORITIES[1];
    const Icon = o.icon;
    return <Badge variant="outline" className={`${o.cls} gap-1`}><Icon className="h-3 w-3" />{o.l}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Header and Action Buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">Capture prospects, qualify and convert them into clients or deals.</p>
        </div>
        <div className="flex items-center gap-2">
          {isUnlimited ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 text-xs py-1 px-2.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" /> Unlimited Leads
            </Badge>
          ) : (
            <Badge 
              variant="outline" 
              className={rows.length >= 50 
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-xs py-1 px-2.5 font-medium" 
                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-xs py-1 px-2.5 font-medium"
              }
            >
              {rows.length} / 50 Leads Used
            </Badge>
          )}
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />Import
          </Button>
          <Button onClick={handleAddLeadClick}>
            <Plus className="h-4 w-4 mr-2" />New Lead
          </Button>
        </div>
      </div>

      {/* Quota limit warning banner for non-CRM/Suite plans */}
      {!isUnlimited && rows.length >= 50 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3.5 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              In this plan you can only add <strong>50 leads maximum</strong>. Upgrade to <strong>Business Suite</strong> or add-on <strong>Business CRM</strong> to your existing plan to add unlimited leads.
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowUpgrade(true)} 
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            Upgrade Plan
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 min-w-0">
          <CardContent className="p-3.5 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1 truncate"><Users className="h-4 w-4 shrink-0" /><span className="text-xs font-medium truncate">Total Leads</span></div>
            <div className="text-slate-900 min-w-0"><AutoFitNumber value={stats.total} /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 min-w-0">
          <CardContent className="p-3.5 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1 truncate"><TrendingUp className="h-4 w-4 shrink-0" /><span className="text-xs font-medium truncate">New This Month</span></div>
            <div className="text-slate-900 min-w-0"><AutoFitNumber value={stats.newThisMonth} /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 min-w-0">
          <CardContent className="p-3.5 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1 truncate"><Target className="h-4 w-4 shrink-0" /><span className="text-xs font-medium truncate">Conversion Rate</span></div>
            <div className="text-slate-900 min-w-0"><AutoFitNumber value={`${stats.conversionRate}%`} /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 min-w-0">
          <CardContent className="p-3.5 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1 truncate"><IndianRupee className="h-4 w-4 shrink-0" /><span className="text-xs font-medium truncate">Pipeline Value</span></div>
            <div className="text-slate-900 min-w-0"><AutoFitNumber value={formatCurrency(stats.pipelineValue, currency)} /></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 min-w-0">
          <CardContent className="p-3.5 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1 truncate"><Flame className="h-4 w-4 shrink-0" /><span className="text-xs font-medium truncate">Hot Leads</span></div>
            <div className="text-slate-900 min-w-0"><AutoFitNumber value={stats.hotLeads} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="followup" className="text-amber-700 dark:text-amber-400 font-medium">Follow-ups Due ({followUpLeadIds.size})</SelectItem>
            {leadStatuses.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All assignees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {crmTeam.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date-wise Filter */}
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <div className="flex items-center gap-1.5 truncate">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Dates" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {dateFilter === "custom" && (
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 w-32 text-xs"
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground font-medium">to</span>
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 w-32 text-xs"
              placeholder="To"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div>
          : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No leads found.</div>
          : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-center">Actions</TableHead>
                <TableHead className="text-right">Others</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${l.id}`)}>
                    <TableCell className="font-medium">
                      <div>{l.name}</div>
                      {l.company && <div className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">{l.company}</div>}
                      <div className="text-[11px] text-muted-foreground/70 font-normal">{format(parseISO(l.created_at), "dd MMM yyyy")}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm flex items-center gap-1">{l.email && <><Mail className="h-3 w-3 text-muted-foreground" />{l.email}</>}{!l.email && "—"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">{l.phone && <><Phone className="h-3 w-3" />{l.phone}</>}</div>
                    </TableCell>
                    <TableCell><span className="text-sm">{l.source || "—"}</span></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={l.status || "new"}
                        onValueChange={(val) => updateLeadStatus(l.id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-[125px] border-slate-200 dark:border-slate-700 bg-background">
                          {statusBadge(l.status)}
                        </SelectTrigger>
                        <SelectContent onClick={(e) => e.stopPropagation()}>
                          {leadStatuses.map((st) => (
                            <SelectItem key={st.v} value={st.v} className="text-xs">
                              {st.l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={l.owner_id || "unassigned"}
                        onValueChange={(val) => updateLeadOwner(l.id, val === "unassigned" ? null : val)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[145px] bg-background hover:bg-accent/40 transition-colors">
                          <div className="flex items-center gap-1.5 truncate">
                            <UserCheck className={`h-3.5 w-3.5 shrink-0 ${l.owner_id ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`} />
                            <span className={`truncate font-medium ${!l.owner_id ? "text-muted-foreground font-normal" : ""}`}>
                              {crmTeam.find(m => m.id === l.owner_id)?.name || "Unassigned"}
                            </span>
                          </div>
                        </SelectTrigger>
                        <SelectContent onClick={(e) => e.stopPropagation()}>
                          <SelectItem value="unassigned">
                            <span className="text-muted-foreground">— Unassigned —</span>
                          </SelectItem>
                          {crmTeam.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} {m.role ? `(${m.role})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{priorityBadge(l.priority)}</TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs gap-1.5 bg-blue-50/70 hover:bg-blue-100 text-[#0d2346] border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 font-medium shadow-2xs"
                        onClick={() => {
                          setSelectedLeadForAction(l);
                          setActionModalOpen(true);
                        }}
                      >
                        <Plus className="h-3 w-3 text-[#e77817]" /> Action
                      </Button>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/leads/${l.id}`)}>
                            <Eye className="mr-2 h-4 w-4 text-slate-500" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(l)}>
                            <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                            Edit Lead
                          </DropdownMenuItem>
                          {l.status !== "converted" && (
                            <DropdownMenuItem onClick={() => convertToClient(l)}>
                              <ArrowRightCircle className="mr-2 h-4 w-4 text-emerald-600" />
                              Convert to Client
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => remove(l.id)}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            <div>
              <Label>Source</Label>
              <Select value={form.source || "none"} onValueChange={(v) => setForm({ ...form, source: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select source…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Mobile No.</Label><Input maxLength={10} placeholder="10-digit mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Estimated Value</Label><Input type="number" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} /></div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Assign To (Sales Team)</Label>
                <button
                  type="button"
                  onClick={() => setAddExecutiveOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Quick Add
                </button>
              </div>
              <Select
                value={form.owner_id || "none"}
                onValueChange={(v) => setForm({ ...form, owner_id: v === "none" ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="Select team member…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {crmTeam.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {m.role ? `(${m.role})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? "Save" : "Add Lead"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Sales Executive Dialog */}
      <Dialog open={addExecutiveOpen} onOpenChange={setAddExecutiveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Add Sales Executive</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Executive Name *</Label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={newTeamMemberName}
              onChange={(e) => setNewTeamMemberName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExecutiveOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAddExecutive} disabled={!newTeamMemberName.trim()}>Add & Select</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog with 50-lead quota guard */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={leadImportFields}
        entityName="Leads"
        onImport={async (importedRows) => {
          const validRows = importedRows.filter((r) => r.name && String(r.name).trim());
          const currentCount = rows.length;

          let rowsToInsert = validRows;
          let skippedDueToLimitCount = 0;
          const failedRows: any[] = [];

          // Entries missing a name fail immediately
          importedRows.forEach((r) => {
            if (!r.name || !String(r.name).trim()) {
              failedRows.push({ row: r, reason: "Lead Name is required." });
            }
          });

          if (!isUnlimited) {
            const remainingQuota = Math.max(0, 50 - currentCount);

            if (remainingQuota === 0) {
              toast({
                title: "50 Leads Limit Reached",
                description: "In this plan you can only add 50 leads maximum. You have already reached your 50 lead quota. Please upgrade to Business Suite or add CRM to your existing plan.",
                variant: "destructive",
              });
              setShowLimitAlert(true);
              return {
                success: 0,
                errors: importedRows.length,
                failedRows: importedRows.map((r) => ({
                  row: r,
                  reason: "Quota limit reached: In this plan you can only add 50 leads maximum. Upgrade to Business Suite or add CRM to existing plan."
                }))
              };
            }

            if (validRows.length > remainingQuota) {
              rowsToInsert = validRows.slice(0, remainingQuota);
              const skippedRows = validRows.slice(remainingQuota);
              skippedDueToLimitCount = skippedRows.length;

              skippedRows.forEach((r) => {
                failedRows.push({
                  row: r,
                  reason: "In this plan you can only add 50 leads maximum. Upgrade to Business Suite or add CRM to your existing plan for unlimited leads."
                });
              });
            }
          }

          let success = 0;
          let errors = 0;

          for (const row of rowsToInsert) {
            const cleanName = cleanLeadField(row.name) || String(row.name || "").trim();
            if (!cleanName) {
              errors++;
              failedRows.push({ row, reason: "Lead Name is required." });
              continue;
            }

            const cleanCompany = cleanLeadField(row.company);
            const cleanEmail = cleanLeadField(row.email);
            const cleanPhone = cleanLeadField(row.phone);
            const cleanSource = cleanLeadField(row.source) || "Other";
            const cleanNotes = cleanLeadField(row.notes);
            const normalizedStatus = normalizeLeadStatus(row.status);
            const normalizedPriority = normalizeLeadPriority(row.priority);
            const cleanEstimatedValue = parseLeadValue(row.estimated_value);
            
            let tags: string[] = [];
            if (Array.isArray(row.tags)) {
              tags = row.tags.map((t: any) => cleanLeadField(t)).filter(Boolean) as string[];
            } else if (row.tags) {
              tags = String(row.tags).split(",").map((t: string) => cleanLeadField(t)).filter(Boolean) as string[];
            }

            const { error } = await (supabase as any).from("leads").insert({
              org_id: org!.id,
              name: cleanName,
              company: cleanCompany,
              email: cleanEmail,
              phone: cleanPhone,
              source: cleanSource,
              status: normalizedStatus,
              priority: normalizedPriority,
              estimated_value: cleanEstimatedValue,
              notes: cleanNotes,
              tags,
            });
            if (error) {
              console.error("Lead import error:", error);
              errors++;
              failedRows.push({ row, reason: error.message || "Database insert error" });
            } else {
              success++;
            }
          }

          await load();

          if (skippedDueToLimitCount > 0) {
            toast({
              title: "50 Leads Limit Reached",
              description: `In this plan you can only add 50 leads maximum. ${success} leads were imported to reach your 50 lead quota, and ${skippedDueToLimitCount} leads were skipped. Please upgrade to Business Suite or add CRM to your existing plan for unlimited leads!`,
              duration: 9000,
            });
            setTimeout(() => {
              setShowLimitAlert(true);
            }, 1000);
          } else if (success > 0) {
            toast({
              title: "Import Complete",
              description: `Successfully imported ${success} leads.`,
            });
          }

          return {
            success,
            errors: errors + skippedDueToLimitCount + (importedRows.length - validRows.length),
            failedRows
          };
        }}
      />
    
      <LimitReachedAlert 
        isOpen={showLimitAlert} 
        onClose={() => setShowLimitAlert(false)} 
        onUpgrade={() => { setShowLimitAlert(false); setShowUpgrade(true); }} 
        title="50 Leads Limit Reached" 
        description="In this plan you can only add 50 leads maximum. Upgrade to Business Suite or add the Business CRM plan to your existing plan to add unlimited leads!" 
      />
      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)} 
        currentPlanName={plan}
        forceOrgId={org?.id}
      />

      {/* Duplicate entry warning popup (Case 26) */}
      <AlertDialog open={!!duplicateAlert?.isOpen} onOpenChange={(open) => !open && setDuplicateAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Duplicate Entry Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-sm text-foreground/80 pt-2">
              <p>
                A lead with this <strong>{duplicateAlert?.field}</strong> (<span className="font-mono text-primary">{duplicateAlert?.value}</span>) already exists in your leads:
              </p>
              <div className="font-semibold text-foreground bg-muted p-2.5 rounded-md border border-border">
                {duplicateAlert?.existingName}
              </div>
              <p className="text-muted-foreground text-xs">
                Do you want to cancel and correct the details, or proceed and save this duplicate lead anyway?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDuplicateAlert(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDuplicateAlert(null);
                save(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Add Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addExecutiveOpen} onOpenChange={setAddExecutiveOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Quick Add Executive</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Executive Name</Label>
              <Input value={newTeamMemberName} onChange={(e) => setNewTeamMemberName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExecutiveOpen(false)}>Cancel</Button>
            <Button onClick={handleQuickAddExecutive} disabled={!newTeamMemberName.trim()}>Save & Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Activity Task Modal */}
      <LeadActivityModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        lead={selectedLeadForAction}
        onSaved={load}
      />
    </div>
  );
}





