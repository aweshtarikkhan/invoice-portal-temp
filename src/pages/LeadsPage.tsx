import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { hasModuleAccess, hasUnlimitedLeads, getLeadLimit, normalizePlanKey, FREE_PLAN_LIMITS } from "@/lib/subscription";
import { LockedFeature } from "@/components/subscription/LockedFeature";
import { LimitReachedAlert } from "@/components/shared/LimitReachedAlert";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { Plus, Pencil, Trash2, ArrowRightCircle, Search, Users, TrendingUp, Target, DollarSign, Flame, Snowflake, Sun, Phone, Mail, Eye, Upload, Sparkles, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";
import { ImportDialog, ImportField } from "@/components/shared/ImportDialog";
import { AutoFitNumber } from "@/components/shared/AutoFitNumber";
import { buildBrandedEmailHtml } from "@/lib/brand-email-template";

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

const emptyForm = { name: "", company: "", email: "", phone: "", source: "", status: "new", estimated_value: "0", notes: "", tags: "", priority: "warm" };

export default function LeadsPage() {
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currency = (org as any)?.currency_code || "INR";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const [{ data: leadsData, error: leadsErr }, { data: subsData }] = await Promise.all([
        (supabase as any).from("leads").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("plan_id, status").eq("org_id", org.id).eq("status", "active")
      ]);
      if (leadsErr) toast({ title: "Load failed", description: leadsErr.message, variant: "destructive" });
      setRows(leadsData || []);
      if (subsData && Array.isArray(subsData)) {
        setActiveOrgPlans(subsData.map((s: any) => s.plan_id));
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
    });
    setOpen(true);
  };

  const save = async () => {
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
    };
    const q = editId
      ? (supabase as any).from("leads").update(payload).eq("id", editId)
      : (supabase as any).from("leads").insert(payload);
    const { error } = await q;
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      setOpen(false);
      load();
      toast({ title: editId ? "Lead updated" : "Lead added" });
      
      // Automation: Welcome Email for New Leads
      if (!editId && payload.email) {
        (supabase as any)
          .from("crm_automations")
          .select("*")
          .eq("org_id", payload.org_id)
          .eq("trigger_event", "lead_created")
          .eq("action_type", "send_email")
          .eq("is_active", true)
          .single()
          .then(({ data: autoData }: any) => {
            if (autoData) {
              const subject = `Welcome to ${org?.name || "Aassay Biz"}, ${payload.name}!`;
              const html = buildBrandedEmailHtml({
                logoUrl: org?.logo_url || "https://aassaybiz.com/logo.png",
                companyName: org?.name || "Aassay Biz",
                companyEmail: org?.email || "support@aassaybiz.com",
                badgeText: "CRM WELCOME",
                title: `Welcome, ${payload.name}!`,
                subtitle: `Thank you for connecting with ${org?.name || "Aassay Biz"}`,
                recipientName: payload.name,
                introText: `Thank you for your interest in our solutions and services. A dedicated representative from our team will review your requirements and reach out to you shortly.`,
                customBodyHtml: `
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0 0 8px; font-weight: 600; color: #0f172a;">What happens next?</p>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                      <li>Our team is reviewing your information.</li>
                      <li>We will connect via phone or email to discuss how we can help.</li>
                      <li>In the meantime, feel free to explore our offerings or reply to this email.</li>
                    </ul>
                  </div>
                `,
              });
              supabase.functions.invoke("send-custom-email", {
                body: { to: payload.email, subject, html, orgId: payload.org_id }
              });
              
              // Log activity
              (supabase as any).from("activities").insert({
                org_id: payload.org_id,
                lead_id: null,
                activity_type: "email",
                title: "Sent Welcome Email (Automated)",
                notes: "Automatically sent welcome email based on CRM Automations rule.",
                status: "completed",
                created_by: payload.owner_id
              }).then();
            }
          });
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
      display_name: l.company || l.name,
      company_name: l.company || null,
      email: l.email || null,
      phone: l.phone || null,
      notes: `Converted from lead. Contact: ${l.name}`,
    }).select("*").single();
    if (error) { toast({ title: "Convert failed", description: error.message, variant: "destructive" }); return; }
    await (supabase as any).from("leads").update({ status: "converted", converted_client_id: client.id }).eq("id", l.id);
    toast({ title: "Converted to Client", description: client.display_name });
    load();
  };

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (priorityFilter !== "all" && (r.priority || "warm") !== priorityFilter) return false;
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
    const o = STATUSES.find((x) => x.v === s) || STATUSES[0];
    return <Badge variant="outline" className={o.cls}>{o.l}</Badge>;
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
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1 truncate"><DollarSign className="h-4 w-4 shrink-0" /><span className="text-xs font-medium truncate">Pipeline Value</span></div>
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
            {STATUSES.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div>
          : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No leads found.</div>
          : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Company</TableHead><TableHead>Contact</TableHead>
                <TableHead>Source</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead>
                <TableHead className="text-right">Est. Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leads/${l.id}`)}>
                    <TableCell className="font-medium">{l.name}<div className="text-xs text-muted-foreground">{format(parseISO(l.created_at), "dd MMM yyyy")}</div></TableCell>
                    <TableCell>{l.company || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-1">{l.email && <><Mail className="h-3 w-3 text-muted-foreground" />{l.email}</>}{!l.email && "—"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">{l.phone && <><Phone className="h-3 w-3" />{l.phone}</>}</div>
                    </TableCell>
                    <TableCell><span className="text-sm">{l.source || "—"}</span></TableCell>
                    <TableCell>{priorityBadge(l.priority)}</TableCell>
                    <TableCell>{statusBadge(l.status)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(l.estimated_value || 0), currency)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="View details" onClick={() => navigate(`/leads/${l.id}`)}><Eye className="h-4 w-4" /></Button>
                      {l.status !== "converted" && (
                        <Button variant="ghost" size="icon" title="Convert to Client" onClick={() => convertToClient(l)}><ArrowRightCircle className="h-4 w-4 text-green-600" /></Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
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
            <div className="col-span-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? "Save" : "Add Lead"}</Button></DialogFooter>
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
    </div>
  );
}
