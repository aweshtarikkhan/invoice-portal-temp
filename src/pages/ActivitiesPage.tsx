import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Check,
  Trash2,
  Phone,
  Mail,
  Users,
  Pencil,
  AlertCircle,
  Clock,
  ArrowRightCircle,
  PlayCircle,
  UserCheck,
  Search,
  Calendar,
  Bell,
  RotateCw,
  MoreVertical,
  MapPin,
  Ticket,
} from "lucide-react";
import { format, parseISO, isPast, isToday, addDays, isBefore } from "date-fns";
import {
  sendActivityReminderNotification,
  getScheduledReminderTime,
  checkAndProcessDueTaskReminders,
} from "@/lib/crm-automations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TASK_TYPES = [
  { v: "Call", l: "Call", icon: Phone, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200" },
  { v: "Meeting", l: "Meeting", icon: Users, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200" },
  { v: "Email", l: "Email", icon: Mail, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200" },
  { v: "Follow-up", l: "Follow-up", icon: ArrowRightCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200" },
  { v: "Demo", l: "Demo", icon: PlayCircle, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200" },
  { v: "Site Visit / Field Visit", l: "Site Visit / Field Visit", icon: MapPin, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-200" },
  { v: "Support Ticket", l: "Support Ticket", icon: Ticket, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200" },
];

const PRIORITIES = [
  { v: "Low", l: "Low", cls: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300" },
  { v: "Medium", l: "Medium", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300" },
  { v: "High", l: "High", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300" },
  { v: "Urgent", l: "Urgent", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300" },
];

const REMINDERS = [
  { v: "none", l: "None" },
  { v: "10_min", l: "10 minutes before" },
  { v: "1_hour", l: "1 hour before" },
  { v: "1_day", l: "1 day before" },
  { v: "custom", l: "Custom Date & Time" },
];

const REPEATS = [
  { v: "none", l: "None" },
  { v: "daily", l: "Daily" },
  { v: "weekly", l: "Weekly" },
];

const STATUSES = [
  { v: "Pending", l: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300" },
  { v: "In Progress", l: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300" },
  { v: "Completed", l: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" },
];

const emptyForm = {
  subject: "",
  body: "",
  priority: "Medium",
  activity_type: "Call",
  related_entity: "none",
  owner_id: "none",
  due_at: "",
  reminder_type: "none",
  custom_reminder_at: "",
  repeat_interval: "none",
  status: "Pending",
};

export default function ActivitiesPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [crmTeam, setCrmTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [viewTab, setViewTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [relSearch, setRelSearch] = useState("");

  const minDateTime = useMemo(() => {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }, [open]);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    try {
      const [{ data: act }, { data: ld }, { data: op }, { data: team }] = await Promise.all([
        (supabase as any)
          .from("activities")
          .select("*, leads(name, company), opportunities(title)")
          .eq("org_id", org.id)
          .order("due_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        (supabase as any).from("leads").select("id, name, company").eq("org_id", org.id).order("name"),
        (supabase as any).from("opportunities").select("id, title").eq("org_id", org.id).order("title"),
        supabase.from("crm_team").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
      ]);
      setRows(act || []);
      setLeads(ld || []);
      setOpps(op || []);
      setCrmTeam(team || []);
    } catch (e: any) {
      console.error("Failed to load activities data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (org?.id) {
      checkAndProcessDueTaskReminders(org);
      const interval = setInterval(() => {
        checkAndProcessDueTaskReminders(org);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [org?.id]);

  const openNew = () => {
    setEditId(null);
    setForm({
      ...emptyForm,
      due_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      custom_reminder_at: "",
    });
    setRelSearch("");
    setOpen(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    let rel = "none";
    if (r.lead_id) rel = `lead:${r.lead_id}`;
    else if (r.opportunity_id) rel = `deal:${r.opportunity_id}`;

    // Normalize type string to capitalize
    const matchedType = TASK_TYPES.find(
      (t) => t.v.toLowerCase() === (r.activity_type || "").toLowerCase()
    );

    let reminderType = r.reminder_type || "none";
    let customReminderAt = "";
    if (reminderType.startsWith("custom:")) {
      customReminderAt = reminderType.slice(7);
      reminderType = "custom";
    }

    setForm({
      subject: r.subject || "",
      body: r.body || "",
      priority: r.priority || "Medium",
      activity_type: matchedType ? matchedType.v : "Call",
      related_entity: rel,
      owner_id: r.owner_id || "none",
      due_at: r.due_at ? format(parseISO(r.due_at), "yyyy-MM-dd'T'HH:mm") : "",
      reminder_type: reminderType,
      custom_reminder_at: customReminderAt,
      repeat_interval: r.repeat_interval || "none",
      status: r.status || (r.completed_at ? "Completed" : "Pending"),
    });
    setRelSearch("");
    setOpen(true);
  };

  const save = async () => {
    if (!org?.id) return;
    if (!form.subject.trim()) {
      toast({ title: "Task Title is required", variant: "destructive" });
      return;
    }

    // Past date & time restriction for due_at
    if (form.due_at) {
      const chosen = new Date(form.due_at);
      const now = new Date();
      // 60-second grace buffer for form interaction time
      if (chosen.getTime() < now.getTime() - 60000) {
        toast({
          title: "Past Date Not Allowed",
          description: "Please select today or a future date & time.",
          variant: "destructive",
        });
        return;
      }
    }

    // Custom reminder validation
    if (form.reminder_type === "custom") {
      if (!form.custom_reminder_at) {
        toast({
          title: "Custom Reminder Required",
          description: "Please select a custom reminder date & time.",
          variant: "destructive",
        });
        return;
      }

      const customTime = new Date(form.custom_reminder_at);
      const now = new Date();
      if (customTime.getTime() < now.getTime() - 60000) {
        toast({
          title: "Past Reminder Time Not Allowed",
          description: "Custom reminder date & time cannot be in the past.",
          variant: "destructive",
        });
        return;
      }

      if (form.due_at) {
        const dueTime = new Date(form.due_at);
        if (customTime.getTime() > dueTime.getTime()) {
          toast({
            title: "Invalid Reminder Time",
            description: "Custom reminder date & time cannot be after the task due date & time.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    let lead_id: string | null = null;
    let opportunity_id: string | null = null;
    if (form.related_entity?.startsWith("lead:")) {
      lead_id = form.related_entity.slice(5);
    } else if (form.related_entity?.startsWith("deal:")) {
      opportunity_id = form.related_entity.slice(5);
    }

    const completed_at = form.status === "Completed" ? new Date().toISOString() : null;
    const finalReminderType =
      form.reminder_type === "custom" && form.custom_reminder_at
        ? `custom:${form.custom_reminder_at}`
        : form.reminder_type;

    const payload: any = {
      org_id: org.id,
      subject: form.subject.trim(),
      body: form.body?.trim() || null,
      priority: form.priority,
      activity_type: form.activity_type,
      lead_id,
      opportunity_id,
      owner_id: form.owner_id === "none" ? null : form.owner_id,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      reminder_type: finalReminderType,
      repeat_interval: form.repeat_interval,
      status: form.status,
      completed_at,
    };

    const q = editId
      ? (supabase as any).from("activities").update(payload).eq("id", editId)
      : (supabase as any).from("activities").insert(payload);

    const { error } = await q;
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    setOpen(false);
    setForm(emptyForm);
    setEditId(null);
    load();
    toast({ title: editId ? "Task updated successfully" : "Task created successfully" });

    // Automation Trigger: If reminder is selected & executive is assigned, dispatch or schedule alert
    if (form.reminder_type !== "none" && form.owner_id && form.owner_id !== "none") {
      const assignee = crmTeam.find((m) => m.id === form.owner_id);
      if (assignee) {
        const scheduledTime = getScheduledReminderTime(payload);
        const now = new Date();

        // If scheduled reminder time is NOW or already reached (e.g. within grace period)
        if (scheduledTime && scheduledTime.getTime() <= now.getTime()) {
          sendActivityReminderNotification({
            org,
            activity: payload,
            assignee,
          });
          toast({
            title: "Reminder Dispatched",
            description: `Live alert dispatched to ${assignee.name} via WhatsApp/Email.`,
          });
        } else {
          const timingLabel =
            form.reminder_type === "10_min"
              ? "10 minutes before task due time"
              : form.reminder_type === "1_hour"
              ? "1 hour before task due time"
              : form.reminder_type === "1_day"
              ? "1 day before task due time"
              : scheduledTime
              ? `at ${format(scheduledTime, "dd MMM yyyy, HH:mm")}`
              : "before due time";

          toast({
            title: "Reminder Scheduled",
            description: `Automated alert scheduled to notify ${assignee.name} exactly ${timingLabel}.`,
          });
        }
      }
    }
  };

  const toggleStatus = async (r: any) => {
    const isCompleted = r.status === "Completed" || !!r.completed_at;
    const nextStatus = isCompleted ? "Pending" : "Completed";
    const nextCompletedAt = isCompleted ? null : new Date().toISOString();

    await (supabase as any)
      .from("activities")
      .update({ status: nextStatus, completed_at: nextCompletedAt })
      .eq("id", r.id);

    setRows((prev) =>
      prev.map((item) =>
        item.id === r.id ? { ...item, status: nextStatus, completed_at: nextCompletedAt } : item
      )
    );
    toast({ title: isCompleted ? "Task marked pending" : "Task marked completed" });
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    await (supabase as any).from("activities").delete().eq("id", id);
    load();
    toast({ title: "Activity deleted" });
  };

  const isOverdue = (r: any) =>
    r.due_at && r.status !== "Completed" && !r.completed_at && isPast(parseISO(r.due_at));
  const isUpcoming = (r: any) =>
    r.due_at &&
    r.status !== "Completed" &&
    !r.completed_at &&
    !isPast(parseISO(r.due_at)) &&
    isBefore(parseISO(r.due_at), addDays(new Date(), 7));
  const isDueToday = (r: any) =>
    r.due_at && r.status !== "Completed" && !r.completed_at && isToday(parseISO(r.due_at));

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && (r.activity_type || "").toLowerCase() !== typeFilter.toLowerCase()) return false;
    if (priorityFilter !== "all" && (r.priority || "Medium").toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (ownerFilter !== "all") {
      if (ownerFilter === "unassigned" && r.owner_id) return false;
      if (ownerFilter !== "unassigned" && r.owner_id !== ownerFilter) return false;
    }
    if (viewTab === "today") return isDueToday(r);
    if (viewTab === "upcoming") return isUpcoming(r);
    if (viewTab === "overdue") return isOverdue(r);
    if (viewTab === "completed") return r.status === "Completed" || !!r.completed_at;

    if (search) {
      const s = search.toLowerCase();
      const matchSubject = r.subject?.toLowerCase().includes(s);
      const matchBody = r.body?.toLowerCase().includes(s);
      const matchLead = r.leads?.name?.toLowerCase().includes(s);
      const matchOpp = r.opportunities?.title?.toLowerCase().includes(s);
      if (!matchSubject && !matchBody && !matchLead && !matchOpp) return false;
    }
    return true;
  });

  const overdueCount = rows.filter(isOverdue).length;
  const todayCount = rows.filter(isDueToday).length;
  const upcomingCount = rows.filter(isUpcoming).length;

  const typeConfig = (t: string) => {
    return (
      TASK_TYPES.find((x) => x.v.toLowerCase() === (t || "").toLowerCase()) || {
        v: t,
        l: t,
        icon: Clock,
        color: "text-slate-500 bg-slate-50 border-slate-200",
      }
    );
  };

  const priorityConfig = (p: string) => {
    return PRIORITIES.find((x) => x.v.toLowerCase() === (p || "Medium").toLowerCase()) || PRIORITIES[1];
  };

  const filteredLeads = leads.filter(
    (l) =>
      !relSearch ||
      l.name?.toLowerCase().includes(relSearch.toLowerCase()) ||
      l.company?.toLowerCase().includes(relSearch.toLowerCase())
  );
  const filteredOpps = opps.filter(
    (o) => !relSearch || o.title?.toLowerCase().includes(relSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities & Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage scheduled calls, meetings, follow-ups, emails and demos with automated team reminders.
          </p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* View Tabs & Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={viewTab} onValueChange={setViewTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today" className="gap-1.5">
              Today
              {todayCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                  {todayCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-1.5">
              Upcoming
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold">
                  {upcomingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5">
              Overdue
              {overdueCount > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-semibold">
                  {overdueCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TASK_TYPES.map((t) => (
                <SelectItem key={t.v} value={t.v}>
                  {t.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.v} value={p.v}>
                  {p.l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {crmTeam.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading activities…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No activities found for current selection. Click "Log Activity" to schedule one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead>Task Title & Description</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Assign To</TableHead>
                  <TableHead>Due Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const overdue = isOverdue(r);
                  const isDone = r.status === "Completed" || !!r.completed_at;
                  const currentType = typeConfig(r.activity_type);
                  const Icon = currentType.icon;
                  const priority = priorityConfig(r.priority);
                  const assignedMember = crmTeam.find((m) => m.id === r.owner_id);

                  return (
                    <TableRow key={r.id} className={overdue ? "bg-red-500/5 hover:bg-red-500/10" : ""}>
                      {/* Task Type */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1.5 py-1 px-2.5 font-medium border text-xs capitalize ${currentType.color}`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{currentType.l}</span>
                        </Badge>
                      </TableCell>

                      {/* Task Title & Description */}
                      <TableCell>
                        <div className={`font-semibold text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {r.subject}
                        </div>
                        {r.body && (
                          <div className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">
                            {r.body}
                          </div>
                        )}
                        {r.reminder_type && r.reminder_type !== "none" && (
                          <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                            <Bell className="h-3 w-3 shrink-0" />
                            <span>
                              Reminder:{" "}
                              {r.reminder_type === "10_min"
                                ? "10m before"
                                : r.reminder_type === "1_hour"
                                ? "1h before"
                                : r.reminder_type === "1_day"
                                ? "1d before"
                                : r.reminder_type.startsWith("custom:")
                                ? `Custom (${(() => {
                                    try {
                                      return format(parseISO(r.reminder_type.slice(7)), "dd MMM, HH:mm");
                                    } catch {
                                      return r.reminder_type.slice(7);
                                    }
                                  })()})`
                                : "Active"}
                            </span>
                            {r.repeat_interval && r.repeat_interval !== "none" && (
                              <span className="flex items-center gap-0.5 ml-2 text-slate-500">
                                <RotateCw className="h-2.5 w-2.5" /> {r.repeat_interval}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      {/* Priority */}
                      <TableCell>
                        <Badge variant="outline" className={`text-xs py-0.5 px-2 font-medium ${priority.cls}`}>
                          {priority.l}
                        </Badge>
                      </TableCell>

                      {/* Related Lead/Deal */}
                      <TableCell className="text-sm">
                        {r.leads?.name && (
                          <div>
                            <span className="text-xs text-muted-foreground">Lead:</span>{" "}
                            <span className="font-medium">{r.leads.name}</span>
                            {r.leads.company && (
                              <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                                {r.leads.company}
                              </div>
                            )}
                          </div>
                        )}
                        {r.opportunities?.title && (
                          <div>
                            <span className="text-xs text-muted-foreground">Deal:</span>{" "}
                            <span className="font-medium">{r.opportunities.title}</span>
                          </div>
                        )}
                        {!r.leads && !r.opportunities && <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      {/* Assign To (Sales Team) */}
                      <TableCell>
                        {assignedMember ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{assignedMember.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Due Date & Time */}
                      <TableCell className="text-sm">
                        {r.due_at ? (
                          <div className={`flex items-center gap-1.5 text-xs ${overdue ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                            {overdue ? <AlertCircle className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
                            <span>{format(parseISO(r.due_at), "dd MMM yyyy, HH:mm")}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isDone ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs">
                            Completed
                          </Badge>
                        ) : overdue ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 text-xs">
                            Overdue
                          </Badge>
                        ) : r.status === "In Progress" ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-xs">
                            In Progress
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 text-xs">
                            Pending
                          </Badge>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => toggleStatus(r)}>
                              <Check className={`mr-2 h-4 w-4 ${isDone ? "text-amber-600" : "text-emerald-600"}`} />
                              {isDone ? "Mark Pending" : "Mark Completed"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="mr-2 h-4 w-4 text-blue-500" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => remove(r.id)}>
                              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New / Edit Activity Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editId ? "Edit Activity Task" : "Log New Activity Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            {/* Task Title */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="taskTitle">Task Title *</Label>
              <Input
                id="taskTitle"
                placeholder="e.g. Follow-up demo call with client"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                autoFocus
              />
            </div>

            {/* Task Type */}
            <div className="space-y-1.5">
              <Label>Task Type</Label>
              <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.v} value={t.v}>
                      <div className="flex items-center gap-2">
                        <t.icon className={`h-4 w-4 ${t.color.split(" ")[0]}`} />
                        <span>{t.l}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.v} value={p.v}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${p.v === 'Urgent' ? 'bg-red-500' : p.v === 'High' ? 'bg-amber-500' : p.v === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                        <span>{p.l}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Related Lead/Deal (Searchable Dropdown) */}
            <div className="space-y-1.5">
              <Label>Related Lead / Deal</Label>
              <Select value={form.related_entity} onValueChange={(v) => setForm({ ...form, related_entity: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select related lead or deal" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="p-2 border-b sticky top-0 bg-popover z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search lead or deal..."
                        value={relSearch}
                        onChange={(e) => setRelSearch(e.target.value)}
                        className="pl-7 h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <SelectItem value="none">— None —</SelectItem>
                  {filteredLeads.length > 0 && (
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40">
                      Leads ({filteredLeads.length})
                    </div>
                  )}
                  {filteredLeads.map((l) => (
                    <SelectItem key={l.id} value={`lead:${l.id}`}>
                      Lead: {l.name} {l.company ? `(${l.company})` : ""}
                    </SelectItem>
                  ))}
                  {filteredOpps.length > 0 && (
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 mt-1">
                      Deals / Opportunities ({filteredOpps.length})
                    </div>
                  )}
                  {filteredOpps.map((o) => (
                    <SelectItem key={o.id} value={`deal:${o.id}`}>
                      Deal: {o.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assign To (Sales Team) */}
            <div className="space-y-1.5">
              <Label>Assign To (Sales Team)</Label>
              <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales executive" />
                </SelectTrigger>
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

            {/* Due Date & Time (Past dates disabled) */}
            <div className="space-y-1.5">
              <Label>Due Date & Time *</Label>
              <Input
                type="datetime-local"
                min={minDateTime}
                value={form.due_at}
                onChange={(e) => {
                  const newDue = e.target.value;
                  setForm((prev: any) => ({
                    ...prev,
                    due_at: newDue,
                    custom_reminder_at:
                      prev.custom_reminder_at && newDue && prev.custom_reminder_at > newDue
                        ? newDue
                        : prev.custom_reminder_at,
                  }));
                }}
              />
              <p className="text-[11px] text-muted-foreground">Select today or a future date & time.</p>
            </div>

            {/* Reminder */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-blue-500" />
                Reminder
              </Label>
              <Select
                value={form.reminder_type}
                onValueChange={(v) => {
                  setForm({
                    ...form,
                    reminder_type: v,
                    custom_reminder_at:
                      v === "custom" && !form.custom_reminder_at
                        ? form.due_at || minDateTime
                        : form.custom_reminder_at,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Set reminder" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDERS.map((r) => (
                    <SelectItem key={r.v} value={r.v}>
                      {r.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">WhatsApp & Email notifications will be dispatched to the assignee.</p>
            </div>

            {/* Custom Reminder Date & Time (Enabled if Reminder is Custom) */}
            {form.reminder_type === "custom" && (
              <div className="col-span-2 space-y-1.5 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customReminderAt" className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Custom Reminder Date & Time *
                  </Label>
                  {form.due_at && (
                    <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                      Max: {(() => {
                        try {
                          return format(parseISO(form.due_at), "dd MMM yyyy, HH:mm");
                        } catch {
                          return form.due_at;
                        }
                      })()}
                    </span>
                  )}
                </div>
                <Input
                  id="customReminderAt"
                  type="datetime-local"
                  min={minDateTime}
                  max={form.due_at || undefined}
                  value={form.custom_reminder_at}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (form.due_at && val > form.due_at) {
                      toast({
                        title: "Max Limit Exceeded",
                        description: "Reminder date & time cannot be after the task due date & time.",
                        variant: "destructive",
                      });
                      setForm({ ...form, custom_reminder_at: form.due_at });
                    } else {
                      setForm({ ...form, custom_reminder_at: val });
                    }
                  }}
                  className="bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  {form.due_at
                    ? "Maximum selectable reminder time is the task Due Date & Time."
                    : "Please set Due Date & Time above to define the maximum limit."}
                </p>
              </div>
            )}

            {/* Repeat */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                Repeat
              </Label>
              <Select value={form.repeat_interval} onValueChange={(v) => setForm({ ...form, repeat_interval: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Repeat frequency" />
                </SelectTrigger>
                <SelectContent>
                  {REPEATS.map((r) => (
                    <SelectItem key={r.v} value={r.v}>
                      {r.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status (Default Pending) */}
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Task status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.v} value={s.v}>
                      {s.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="taskDesc">Description</Label>
              <Textarea
                id="taskDesc"
                rows={3}
                placeholder="Enter activity description, discussion agenda, or meeting details..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editId ? "Update Activity" : "Save Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
