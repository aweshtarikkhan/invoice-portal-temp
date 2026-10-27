import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  startOfDay,
  endOfDay,
  isPast,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Clock,
  IndianRupee,
  UserPlus,
  X,
  Check,
  CheckCircle2,
  Circle,
  AlertCircle,
  Users,
  UserCheck,
  MapPin,
  Ticket,
  PlayCircle,
  ArrowRightCircle,
  Search,
  Filter,
  Plus,
  MessageCircle,
  RotateCw,
  ListTodo,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { sendActivityReminderNotification, checkAndProcessDueTaskReminders } from "@/lib/crm-automations";

interface CalendarItem {
  id: string;
  rawId?: string;
  type: "activity" | "opportunity" | "lead";
  date: string;
  title: string;
  subTitle: string;
  body?: string;
  activity_type?: string;
  amount?: number;
  status: string;
  priority?: string;
  owner_id?: string | null;
  assignedTo?: string;
  assignedRole?: string;
  assignedPhone?: string;
  leadName?: string;
  leadCompany?: string;
  dealTitle?: string;
}

const TASK_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; badgeCls: string }> = {
  call: { label: "Call", icon: Phone, color: "text-blue-500", badgeCls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300" },
  meeting: { label: "Meeting", icon: Users, color: "text-purple-500", badgeCls: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300" },
  email: { label: "Email", icon: Mail, color: "text-emerald-500", badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300" },
  "follow-up": { label: "Follow-up", icon: ArrowRightCircle, color: "text-amber-500", badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300" },
  demo: { label: "Demo", icon: PlayCircle, color: "text-indigo-500", badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300" },
  "site visit / field visit": { label: "Site Visit / Field Visit", icon: MapPin, color: "text-teal-600", badgeCls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300" },
  "support ticket": { label: "Support Ticket", icon: Ticket, color: "text-rose-600", badgeCls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300" },
};

function getTaskTypeInfo(type?: string) {
  const norm = (type || "").toLowerCase().trim();
  if (norm.includes("site") || norm.includes("visit") || norm.includes("field")) {
    return TASK_TYPE_CONFIG["site visit / field visit"];
  }
  if (norm.includes("ticket") || norm.includes("support")) {
    return TASK_TYPE_CONFIG["support ticket"];
  }
  return TASK_TYPE_CONFIG[norm] || {
    label: type || "Task",
    icon: Clock,
    color: "text-slate-500",
    badgeCls: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

function getPriorityBadgeCls(priority?: string) {
  switch ((priority || "").toLowerCase()) {
    case "urgent":
      return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300";
    case "high":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
    case "low":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
  }
}

function DayPopover({ items, onClose }: { items: CalendarItem[]; onClose: () => void }) {
  return (
    <div className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 w-72 mt-1 left-0 top-full">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {items.length} Event{items.length > 1 ? "s" : ""}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {items.map((item) => {
          const typeInfo = getTaskTypeInfo(item.activity_type);
          const IconComponent = typeInfo.icon;
          return (
            <div
              key={item.id}
              className={`p-2 rounded-lg text-xs border ${
                item.status === "completed"
                  ? "bg-slate-50 border-slate-200 text-slate-500 line-through dark:bg-slate-800/50"
                  : item.type === "opportunity"
                  ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                  : item.type === "lead"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
              }`}
            >
              <div className="flex items-center justify-between font-semibold gap-1 mb-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  {item.type === "opportunity" ? (
                    <IndianRupee className="w-3 h-3 flex-shrink-0 text-amber-600" />
                  ) : item.type === "lead" ? (
                    <UserPlus className="w-3 h-3 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <IconComponent className={`w-3 h-3 flex-shrink-0 ${typeInfo.color}`} />
                  )}
                  <span className="truncate">{item.title}</span>
                </div>
                {item.date && (
                  <span className="text-[10px] font-normal text-slate-500 shrink-0">
                    {format(parseISO(item.date), "HH:mm")}
                  </span>
                )}
              </div>
              {item.subTitle && <div className="text-[10px] opacity-75 truncate">{item.subTitle}</div>}
              {item.assignedTo && (
                <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>{item.assignedTo}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayCell({
  day,
  items,
  isCurrentMonth,
  viewMode,
  onSelectDay,
}: {
  day: Date;
  items: CalendarItem[];
  isCurrentMonth: boolean;
  viewMode: "week" | "month";
  onSelectDay: (d: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const MAX_VISIBLE = viewMode === "month" ? 2 : 4;
  const visible = items.slice(0, MAX_VISIBLE);
  const extra = items.length - MAX_VISIBLE;

  return (
    <div
      ref={ref}
      className={`relative border-r border-b border-slate-200 dark:border-slate-800 p-2 min-h-[6.5rem] transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 ${
        !isCurrentMonth && viewMode === "month" ? "bg-slate-50/40 text-slate-400 dark:bg-slate-900/40" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={() => onSelectDay(day)}
          className={`text-xs px-1.5 py-0.5 rounded font-medium hover:bg-blue-50 dark:hover:bg-blue-950/40 ${
            isToday(day)
              ? "bg-blue-600 text-white font-bold hover:bg-blue-700"
              : "text-slate-600 dark:text-slate-400 hover:text-blue-600"
          }`}
          title="Click to view daily task tracking for this day"
        >
          {format(day, "d")}
        </button>
        {items.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium">
            {items.length} {items.length === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {visible.map((item) => {
          const typeInfo = getTaskTypeInfo(item.activity_type);
          const IconComponent = typeInfo.icon;
          return (
            <div
              key={item.id}
              className={`p-1.5 rounded-md text-xs border truncate flex items-center justify-between gap-1 cursor-default ${
                item.status === "completed"
                  ? "bg-slate-50 border-slate-200 text-slate-500 line-through dark:bg-slate-800/40 dark:border-slate-700"
                  : item.type === "opportunity"
                  ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800"
                  : item.type === "lead"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800"
                  : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800"
              }`}
            >
              <div className="flex items-center gap-1 truncate">
                {item.type === "opportunity" ? (
                  <IndianRupee className="w-2.5 h-2.5 flex-shrink-0 text-amber-600" />
                ) : item.type === "lead" ? (
                  <UserPlus className="w-2.5 h-2.5 flex-shrink-0 text-emerald-600" />
                ) : (
                  <IconComponent className={`w-2.5 h-2.5 flex-shrink-0 ${typeInfo.color}`} />
                )}
                <span className="truncate font-medium">{item.title}</span>
              </div>
              {item.assignedTo && (
                <span className="text-[9px] font-semibold text-blue-800 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-900/50 px-1 py-0.2 rounded shrink-0 max-w-[60px] truncate">
                  {item.assignedTo.split(" ")[0]}
                </span>
              )}
            </div>
          );
        })}

        {extra > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="w-full text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium text-left px-1 py-0.5"
          >
            +{extra} more...
          </button>
        )}
      </div>

      {open && <DayPopover items={items} onClose={() => setOpen(false)} />}
    </div>
  );
}

export default function CRMCalendarPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();

  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [crmTeam, setCrmTeam] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("day");

  // Filters for Daily Tracker
  const [selectedExecutive, setSelectedExecutive] = useState<string>("all");
  const [searchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>(() => searchParams.get("status") || "all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quick Task Creation Modal
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    subject: "",
    body: "",
    activity_type: "Call",
    priority: "Medium",
    owner_id: "none",
    due_time: "10:00",
    lead_id: "none",
  });
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    const st = searchParams.get("status");
    if (st && ["all", "pending", "completed"].includes(st)) {
      setSelectedStatus(st);
      setViewMode("day");
    }
  }, [searchParams]);

  useEffect(() => {
    if (org?.id) {
      fetchCalendarData();
      checkAndProcessDueTaskReminders(org);
      const interval = setInterval(() => {
        checkAndProcessDueTaskReminders(org);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [org?.id, currentDate, viewMode]);

  const fetchCalendarData = async () => {
    if (!org?.id) return;
    setLoading(true);

    try {
      let start: Date;
      let end: Date;

      if (viewMode === "day") {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      } else if (viewMode === "week") {
        start = startOfWeek(currentDate, { weekStartsOn: 1 });
        end = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      }

      const startStr = start.toISOString();
      const endStr = end.toISOString();

      const [{ data: actData }, { data: oppData }, { data: leadsData }, { data: teamData }, { data: allLeads }] =
        await Promise.all([
          (supabase as any)
            .from("activities")
            .select("*, leads(id, name, company), opportunities(id, title)")
            .eq("org_id", org.id)
            .gte("due_at", startStr)
            .lte("due_at", endStr)
            .order("due_at", { ascending: true }),
          (supabase as any)
            .from("opportunities")
            .select("*, leads(name, company)")
            .eq("org_id", org.id)
            .gte("expected_close_date", startStr)
            .lte("expected_close_date", endStr),
          (supabase as any)
            .from("leads")
            .select("id, name, company, created_at")
            .eq("org_id", org.id)
            .gte("created_at", startStr)
            .lte("created_at", endStr),
          supabase.from("crm_team").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
          (supabase as any).from("leads").select("id, name, company").eq("org_id", org.id).order("name"),
        ]);

      const teamList = teamData || [];
      setCrmTeam(teamList);
      setLeads(allLeads || []);

      const teamMap = new Map<string, any>();
      teamList.forEach((m: any) => teamMap.set(m.id, m));

      const items: CalendarItem[] = [];

      (actData || []).forEach((a: any) => {
        const assignedMember = a.owner_id ? teamMap.get(a.owner_id) : null;
        items.push({
          id: `act_${a.id}`,
          rawId: a.id,
          type: "activity",
          date: a.due_at,
          title: a.subject || "Activity",
          subTitle: a.leads?.name ? `Lead: ${a.leads.name}` : a.opportunities?.title ? `Deal: ${a.opportunities.title}` : "",
          body: a.body || "",
          activity_type: a.activity_type || "Call",
          priority: a.priority || "Medium",
          status: a.status || (a.completed_at ? "completed" : "pending"),
          owner_id: a.owner_id,
          assignedTo: assignedMember ? assignedMember.name : undefined,
          assignedRole: assignedMember ? assignedMember.role : undefined,
          assignedPhone: assignedMember ? assignedMember.phone : undefined,
          leadName: a.leads?.name,
          leadCompany: a.leads?.company,
          dealTitle: a.opportunities?.title,
        });
      });

      if (viewMode !== "day") {
        (oppData || []).forEach((o: any) => {
          items.push({
            id: `opp_${o.id}`,
            type: "opportunity",
            date: o.expected_close_date,
            title: o.title,
            subTitle: o.leads?.name || "",
            amount: o.amount,
            status: "open",
          });
        });

        (leadsData || []).forEach((l: any) => {
          items.push({
            id: `lead_${l.id}`,
            type: "lead",
            date: l.created_at,
            title: `New Lead: ${l.name || "Unknown"}`,
            subTitle: l.company || "",
            status: "open",
          });
        });
      }

      setCalendarItems(items);
    } catch (err: any) {
      console.error("Error fetching calendar events:", err);
      toast({ title: "Failed to load calendar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Toggle activity status directly from Daily Tracker
  const handleToggleTaskStatus = async (item: CalendarItem) => {
    if (!item.rawId) return;
    const isCompleted = item.status === "completed" || item.status === "Completed";
    const nextStatus = isCompleted ? "Pending" : "Completed";
    const nextCompletedAt = isCompleted ? null : new Date().toISOString();

    const { error } = await (supabase as any)
      .from("activities")
      .update({ status: nextStatus, completed_at: nextCompletedAt })
      .eq("id", item.rawId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    setCalendarItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: nextStatus.toLowerCase(),
            }
          : i
      )
    );

    toast({
      title: isCompleted ? "Task Marked Pending" : "Task Marked Completed",
      description: item.title,
    });
  };

  // 1-Click reassign task to a sales team executive
  const handleReassignTask = async (item: CalendarItem, newOwnerId: string) => {
    if (!item.rawId || !org?.id) return;
    const targetOwner = newOwnerId === "none" ? null : newOwnerId;
    const targetMember = crmTeam.find((m) => m.id === newOwnerId);

    const { error } = await (supabase as any)
      .from("activities")
      .update({ owner_id: targetOwner })
      .eq("id", item.rawId);

    if (error) {
      toast({ title: "Reassignment failed", description: error.message, variant: "destructive" });
      return;
    }

    setCalendarItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              owner_id: targetOwner,
              assignedTo: targetMember ? targetMember.name : undefined,
              assignedRole: targetMember ? targetMember.role : undefined,
              assignedPhone: targetMember ? targetMember.phone : undefined,
            }
          : i
      )
    );

    toast({
      title: "Task Reassigned",
      description: targetMember ? `Assigned to ${targetMember.name}` : "Marked unassigned",
    });

    if (targetMember) {
      sendActivityReminderNotification({
        org,
        activity: { subject: item.title, due_at: item.date, priority: item.priority },
        assignee: targetMember,
      });
    }
  };

  // Quick Task Creation for Selected Day
  const handleQuickSaveTask = async () => {
    if (!org?.id || !quickForm.subject.trim()) {
      toast({ title: "Task Title is required", variant: "destructive" });
      return;
    }

    setSavingTask(true);
    try {
      const dayDateStr = format(currentDate, "yyyy-MM-dd");
      const fullIsoDate = new Date(`${dayDateStr}T${quickForm.due_time}:00`).toISOString();

      const payload: any = {
        org_id: org.id,
        subject: quickForm.subject.trim(),
        body: quickForm.body?.trim() || null,
        activity_type: quickForm.activity_type,
        priority: quickForm.priority,
        owner_id: quickForm.owner_id === "none" ? null : quickForm.owner_id,
        lead_id: quickForm.lead_id === "none" ? null : quickForm.lead_id,
        due_at: fullIsoDate,
        status: "Pending",
        reminder_type: "none",
        repeat_interval: "none",
      };

      const { data, error } = await (supabase as any).from("activities").insert(payload).select().single();
      if (error) throw error;

      toast({ title: "Task Added for Today", description: quickForm.subject });
      setQuickAddOpen(false);
      setQuickForm({
        subject: "",
        body: "",
        activity_type: "Call",
        priority: "Medium",
        owner_id: "none",
        due_time: "10:00",
        lead_id: "none",
      });
      fetchCalendarData();
    } catch (err: any) {
      toast({ title: "Error creating task", description: err.message, variant: "destructive" });
    } finally {
      setSavingTask(false);
    }
  };

  // Filter items for the Daily Tracker
  const dayActivities = useMemo(() => {
    return calendarItems.filter((item) => {
      if (item.type !== "activity") return false;

      // Executive filter
      if (selectedExecutive !== "all") {
        if (selectedExecutive === "unassigned" && item.owner_id) return false;
        if (selectedExecutive !== "unassigned" && item.owner_id !== selectedExecutive) return false;
      }

      // Status filter
      if (selectedStatus !== "all") {
        const isDone = item.status === "completed" || item.status === "Completed";
        if (selectedStatus === "completed" && !isDone) return false;
        if (selectedStatus === "pending" && isDone) return false;
      }

      // Type filter
      if (selectedType !== "all") {
        if ((item.activity_type || "").toLowerCase() !== selectedType.toLowerCase()) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchBody = item.body?.toLowerCase().includes(q);
        const matchLead = item.leadName?.toLowerCase().includes(q);
        const matchAssigned = item.assignedTo?.toLowerCase().includes(q);
        if (!matchTitle && !matchBody && !matchLead && !matchAssigned) return false;
      }

      return true;
    });
  }, [calendarItems, selectedExecutive, selectedStatus, selectedType, searchQuery]);

  // Daily statistics
  const dayStats = useMemo(() => {
    const total = dayActivities.length;
    const completed = dayActivities.filter((a) => a.status === "completed" || a.status === "Completed").length;
    const pending = total - completed;
    const activeTeamIds = new Set(dayActivities.filter((a) => a.owner_id).map((a) => a.owner_id));
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, activeExecutives: activeTeamIds.size, completionRate };
  }, [dayActivities]);

  // Group daily activities by Sales Team Executive
  const groupedByExecutive = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();

    // Pre-populate with all active crm_team members if no executive filter is chosen
    crmTeam.forEach((m) => {
      if (selectedExecutive === "all" || selectedExecutive === m.id) {
        map.set(m.id, []);
      }
    });

    // Unassigned container
    if (selectedExecutive === "all" || selectedExecutive === "unassigned") {
      map.set("unassigned", []);
    }

    dayActivities.forEach((item) => {
      const key = item.owner_id || "unassigned";
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    return map;
  }, [dayActivities, crmTeam, selectedExecutive]);

  // Days for Month and Week Views
  const days = useMemo(() => {
    let start: Date;
    let end: Date;
    if (viewMode === "week") {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  // Navigate dates
  const handlePrev = () => {
    if (viewMode === "day") setCurrentDate((d) => subDays(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subMonths(d, 1));
  };

  const handleNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addMonths(d, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 overflow-y-auto min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Calendar & Daily Task Tracking
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex bg-blue-50 text-blue-700 border-blue-200">
              CRM Sales Operations
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track daily schedules, assigned sales team activities, and team execution.
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Modes */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === "day"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Today's Tasks (Sales Team)</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === "week"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === "month"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
          </div>

          {/* Quick Task Add Button */}
          <Button
            size="sm"
            onClick={() => setQuickAddOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 shadow-sm gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Date Navigation & Filter Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Date Selector Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={isToday(currentDate) ? "default" : "outline"}
              size="sm"
              className="h-9 text-xs font-medium"
              onClick={handleJumpToToday}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="ml-2">
              <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                {viewMode === "day"
                  ? format(currentDate, "EEEE, dd MMMM yyyy")
                  : viewMode === "week"
                  ? `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM yyyy")}`
                  : format(currentDate, "MMMM yyyy")}
              </div>
              {viewMode === "day" && (
                <div className="text-xs text-muted-foreground font-medium">
                  {isToday(currentDate) ? "Today's Live Task Tracking" : "Historical / Scheduled Tasks View"}
                </div>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sales Executive Filter */}
            <Select value={selectedExecutive} onValueChange={setSelectedExecutive}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <SelectValue placeholder="All Sales Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 All Sales Team</SelectItem>
                <SelectItem value="unassigned">⚠️ Unassigned Tasks</SelectItem>
                {crmTeam.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    👤 {m.name} ({m.role || "Sales"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* In Daily View: Search, Status, and Type filters */}
            {viewMode === "day" && (
              <>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32 h-9 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">⏳ Pending Only</SelectItem>
                    <SelectItem value="completed">✅ Completed Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Task Types</SelectItem>
                    <SelectItem value="Call">📞 Call</SelectItem>
                    <SelectItem value="Meeting">👥 Meeting</SelectItem>
                    <SelectItem value="Email">✉️ Email</SelectItem>
                    <SelectItem value="Follow-up">➡️ Follow-up</SelectItem>
                    <SelectItem value="Demo">▶️ Demo</SelectItem>
                    <SelectItem value="Site Visit / Field Visit">📍 Site / Field Visit</SelectItem>
                    <SelectItem value="Support Ticket">🎫 Support Ticket</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative w-44">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-800"
              onClick={fetchCalendarData}
              title="Refresh Tasks"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================== */}
      {/* 1. DAILY TASK TRACKING VIEW (TODAY'S TASKS FOR SALES TEAM) */}
      {/* ======================================================== */}
      {viewMode === "day" && (
        <div className="space-y-6">
          {/* Daily KPI Metrics Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-3.5">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Tasks Today
                </div>
                <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">{dayStats.total}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Scheduled for this day</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm border-l-4 border-l-emerald-500">
              <CardContent className="p-3.5">
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Completed Tasks
                </div>
                <div className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">
                  {dayStats.completed}
                </div>
                <div className="text-[11px] text-emerald-600/80 mt-0.5">Execution done</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm border-l-4 border-l-amber-500">
              <CardContent className="p-3.5">
                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Pending Tasks
                </div>
                <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">{dayStats.pending}</div>
                <div className="text-[11px] text-amber-600/80 mt-0.5">Action required</div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-3.5">
                <div className="text-[11px] font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Sales Team Members
                </div>
                <div className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">
                  {dayStats.activeExecutives} / {crmTeam.length}
                </div>
                <div className="text-[11px] text-blue-600/80 mt-0.5">Members with tasks today</div>
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Team Progress</span>
                  <span className="font-bold text-blue-600">{dayStats.completionRate}%</span>
                </div>
                <Progress value={dayStats.completionRate} className="h-2 mt-2" />
                <div className="text-[11px] text-muted-foreground mt-1.5 text-right">
                  {dayStats.completed} of {dayStats.total} done
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sales Team Daily Task Sections */}
          {loading ? (
            <div className="p-12 text-center text-muted-foreground bg-white dark:bg-slate-900 rounded-xl border">
              Loading today's sales tasks…
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. Unassigned Tasks Card (if any exist) */}
              {groupedByExecutive.has("unassigned") && groupedByExecutive.get("unassigned")!.length > 0 && (
                <Card className="border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm">
                  <CardHeader className="py-3 px-4 border-b border-amber-200 dark:border-amber-900/60 bg-amber-100/40 dark:bg-amber-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <CardTitle className="text-sm font-bold text-amber-900 dark:text-amber-200">
                          Unassigned Tasks for Today ({groupedByExecutive.get("unassigned")!.length})
                        </CardTitle>
                      </div>
                      <span className="text-xs text-amber-700 dark:text-amber-400">
                        Assign these tasks to a sales executive below
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2.5">
                    {groupedByExecutive.get("unassigned")!.map((task) => (
                      <TaskRowCard
                        key={task.id}
                        task={task}
                        crmTeam={crmTeam}
                        onToggleStatus={() => handleToggleTaskStatus(task)}
                        onReassign={(newId) => handleReassignTask(task, newId)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 2. Team Member Task Cards */}
              <div className="grid grid-cols-1 gap-5">
                {crmTeam
                  .filter((member) => selectedExecutive === "all" || selectedExecutive === member.id)
                  .map((member) => {
                    const memberTasks = groupedByExecutive.get(member.id) || [];
                    const completedCount = memberTasks.filter(
                      (t) => t.status === "completed" || t.status === "Completed"
                    ).length;
                    const totalCount = memberTasks.length;
                    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                    return (
                      <Card
                        key={member.id}
                        className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                      >
                        {/* Member Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                              {member.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{member.name}</h3>
                                <Badge variant="outline" className="text-[11px] py-0 px-2 font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40">
                                  {member.role || "Sales Executive"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                {member.phone && (
                                  <a
                                    href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-emerald-600 flex items-center gap-1"
                                    title="WhatsApp Sales Executive"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-500" />
                                    <span>{member.phone}</span>
                                  </a>
                                )}
                                {member.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{member.email}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Member Progress & Task Count */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {completedCount} of {totalCount} Completed
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {totalCount === 0 ? "No tasks today" : `${totalCount - completedCount} pending`}
                              </div>
                            </div>
                            <div className="w-28">
                              <Progress value={percent} className="h-2" />
                            </div>
                          </div>
                        </div>

                        {/* Task List Under This Member */}
                        <CardContent className="p-4 space-y-2.5">
                          {memberTasks.length === 0 ? (
                            <div className="py-6 text-center text-muted-foreground text-xs italic bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                              No tasks scheduled for {member.name} today.
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setQuickForm((f) => ({ ...f, owner_id: member.id }));
                                    setQuickAddOpen(true);
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Assign a Task
                                </Button>
                              </div>
                            </div>
                          ) : (
                            memberTasks.map((task) => (
                              <TaskRowCard
                                key={task.id}
                                task={task}
                                crmTeam={crmTeam}
                                onToggleStatus={() => handleToggleTaskStatus(task)}
                                onReassign={(newId) => handleReassignTask(task, newId)}
                              />
                            ))
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. WEEK & MONTH CALENDAR VIEWS */}
      {/* ======================================================== */}
      {viewMode !== "day" && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-r last:border-r-0 border-slate-200 dark:border-slate-800"
              >
                {day}
              </div>
            ))}
          </div>
          <div
            className={`grid grid-cols-7 ${
              viewMode === "month" ? "auto-rows-[minmax(125px,auto)]" : "auto-rows-[minmax(220px,auto)]"
            } bg-white dark:bg-slate-900`}
          >
            {days.map((day, idx) => {
              const dayItems = calendarItems.filter((a) => {
                if (!a.date || !isSameDay(parseISO(a.date), day)) return false;
                if (selectedExecutive !== "all") {
                  if (selectedExecutive === "unassigned" && a.owner_id) return false;
                  if (selectedExecutive !== "unassigned" && a.owner_id !== selectedExecutive) return false;
                }
                return true;
              });

              return (
                <DayCell
                  key={idx}
                  day={day}
                  items={dayItems}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  viewMode={viewMode}
                  onSelectDay={(selected) => {
                    setCurrentDate(selected);
                    setViewMode("day");
                  }}
                />
              );
            })}
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* QUICK ADD TASK MODAL DIALOG */}
      {/* ======================================================== */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Add Sales Task for {format(currentDate, "dd MMM yyyy")}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="quickTaskTitle">Task Title *</Label>
              <Input
                id="quickTaskTitle"
                placeholder="e.g. Follow-up demo call with client"
                value={quickForm.subject}
                onChange={(e) => setQuickForm({ ...quickForm, subject: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Task Type</Label>
                <Select
                  value={quickForm.activity_type}
                  onValueChange={(v) => setQuickForm({ ...quickForm, activity_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Call">📞 Call</SelectItem>
                    <SelectItem value="Meeting">👥 Meeting</SelectItem>
                    <SelectItem value="Email">✉️ Email</SelectItem>
                    <SelectItem value="Follow-up">➡️ Follow-up</SelectItem>
                    <SelectItem value="Demo">▶️ Demo</SelectItem>
                    <SelectItem value="Site Visit / Field Visit">📍 Site Visit / Field Visit</SelectItem>
                    <SelectItem value="Support Ticket">🎫 Support Ticket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={quickForm.priority}
                  onValueChange={(v) => setQuickForm({ ...quickForm, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assign To (Sales Team)</Label>
                <Select
                  value={quickForm.owner_id}
                  onValueChange={(v) => setQuickForm({ ...quickForm, owner_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign To" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {crmTeam.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.role || "Sales"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Due Time</Label>
                <Input
                  type="time"
                  value={quickForm.due_time}
                  onChange={(e) => setQuickForm({ ...quickForm, due_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Related Lead</Label>
              <Select
                value={quickForm.lead_id}
                onValueChange={(v) => setQuickForm({ ...quickForm, lead_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Lead (Optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="none">— None —</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} {l.company ? `(${l.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes / Description</Label>
              <Textarea
                rows={2}
                placeholder="Optional task notes..."
                value={quickForm.body}
                onChange={(e) => setQuickForm({ ...quickForm, body: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickSaveTask} disabled={savingTask} className="bg-blue-600 hover:bg-blue-700 text-white">
              {savingTask ? "Saving..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponent for each task item in the daily task list
function TaskRowCard({
  task,
  crmTeam,
  onToggleStatus,
  onReassign,
}: {
  task: CalendarItem;
  crmTeam: any[];
  onToggleStatus: () => void;
  onReassign: (newOwnerId: string) => void;
}) {
  const isDone = task.status === "completed" || task.status === "Completed";
  const typeInfo = getTaskTypeInfo(task.activity_type);
  const IconComponent = typeInfo.icon;
  const isTaskOverdue =
    !isDone && task.date && isPast(parseISO(task.date)) && !isToday(parseISO(task.date));

  return (
    <div
      className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isDone
          ? "bg-slate-50/70 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800"
          : isTaskOverdue
          ? "bg-red-50/30 border-red-200 dark:bg-red-950/20 dark:border-red-900/60"
          : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800"
      }`}
    >
      {/* Left: Checkbox + Title + Badges */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* 1-Click Toggle Checkbox */}
        <button
          onClick={onToggleStatus}
          className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
            isDone
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "border border-slate-300 hover:border-blue-500 bg-white dark:bg-slate-800 dark:border-slate-700"
          }`}
          title={isDone ? "Click to Mark Pending" : "Click to Mark Completed"}
        >
          {isDone ? <Check className="w-3.5 h-3.5" /> : null}
        </button>

        {/* Content Details */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold text-sm ${
                isDone ? "line-through text-muted-foreground" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {task.title}
            </span>

            {/* Task Type Badge */}
            <Badge variant="outline" className={`gap-1 py-0 px-2 text-[10px] font-medium ${typeInfo.badgeCls}`}>
              <IconComponent className={`w-3 h-3 ${typeInfo.color}`} />
              <span>{typeInfo.label}</span>
            </Badge>

            {/* Priority Badge */}
            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-medium ${getPriorityBadgeCls(task.priority)}`}>
              {task.priority || "Medium"}
            </Badge>

            {/* Status Badge */}
            {isDone ? (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                Completed
              </Badge>
            ) : isTaskOverdue ? (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium bg-red-50 text-red-700 border-red-200">
                Overdue
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium bg-amber-50 text-amber-700 border-amber-200">
                Pending
              </Badge>
            )}
          </div>

          {/* Description snippet */}
          {task.body && (
            <p className="text-xs text-muted-foreground line-clamp-1">{task.body}</p>
          )}

          {/* Related Lead or Deal */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {task.leadName && (
              <span className="font-medium text-blue-700 dark:text-blue-400">
                Lead: {task.leadName} {task.leadCompany ? `(${task.leadCompany})` : ""}
              </span>
            )}
            {task.dealTitle && (
              <span className="font-medium text-purple-700 dark:text-purple-400">
                Deal: {task.dealTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Time & Assignee Reassignment */}
      <div className="flex items-center gap-3 justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800">
        {/* Due Time */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>{task.date ? format(parseISO(task.date), "HH:mm") : "Anytime"}</span>
        </div>

        {/* Quick Assign Dropdown */}
        <div className="flex items-center gap-1">
          <Select
            value={task.owner_id || "none"}
            onValueChange={(val) => onReassign(val)}
          >
            <SelectTrigger className="h-7 text-xs w-36 bg-slate-50 dark:bg-slate-800">
              <SelectValue placeholder="Assign To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Unassigned —</SelectItem>
              {crmTeam.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
