import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { ChevronLeft, ChevronRight, Save, Send, MapPin, Clock, MessageSquare, UserCircle2, Calculator, Edit3, Sparkles, HardHat } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { SalariesTab } from "@/components/payroll/SalariesTab";

type Status = "present" | "late" | "absent" | "half_day" | "paid_leave" | "holiday";

const STATUS_OPTIONS: { value: Status; label: string; short: string; cls: string }[] = [
  { value: "present",    label: "Present",    short: "P",  cls: "bg-green-100 text-green-700 border-green-300" },
  { value: "late",       label: "Late",        short: "L",  cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "half_day",   label: "Half-day",    short: "H",  cls: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "absent",     label: "Absent",      short: "A",  cls: "bg-red-100 text-red-700 border-red-300" },
  { value: "paid_leave", label: "Paid Leave",  short: "PL", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "holiday",    label: "Holiday",     short: "HO", cls: "bg-muted text-muted-foreground border-border" },
];

interface Employee {
  id: string; name: string; monthly_salary: number; paid_leaves_per_month: number; is_active: boolean;
}
interface AttRow { id?: string; employee_id: string; attendance_date: string; status: Status; }

const INDIAN_FESTIVALS = [
  { name: "Republic Day", date: "2026-01-26", type: "public" },
  { name: "Maha Shivaratri", date: "2026-02-14", type: "public" },
  { name: "Holi", date: "2026-03-04", type: "public" },
  { name: "Ram Navami", date: "2026-03-27", type: "public" },
  { name: "Mahavir Jayanti", date: "2026-04-01", type: "public" },
  { name: "Good Friday", date: "2026-04-03", type: "public" },
  { name: "Id-ul-Fitr", date: "2026-03-20", type: "public" },
  { name: "Buddha Purnima", date: "2026-05-01", type: "public" },
  { name: "Bakrid / Eid al Adha", date: "2026-05-27", type: "public" },
  { name: "Muharram", date: "2026-06-25", type: "public" },
  { name: "Independence Day", date: "2026-08-15", type: "public" },
  { name: "Raksha Bandhan", date: "2026-08-28", type: "public" },
  { name: "Janmashtami", date: "2026-09-04", type: "public" },
  { name: "Gandhi Jayanti", date: "2026-10-02", type: "public" },
  { name: "Dussehra", date: "2026-10-19", type: "public" },
  { name: "Diwali", date: "2026-11-08", type: "public" },
  { name: "Guru Nanak Jayanti", date: "2026-11-24", type: "public" },
  { name: "Christmas", date: "2026-12-25", type: "public" }
];

export default function AttendancePage() {
  const org = useAppStore((s) => s.organization);
  const setOrganization = useAppStore((s) => s.setOrganization);
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [att, setAtt] = useState<Record<string, Status>>({});
  const [rawAtt, setRawAtt] = useState<any[]>([]);
  const [clockData, setClockData] = useState<Record<string, any>>({});
  const [selectedClockInfo, setSelectedClockInfo] = useState<any | null>(null);
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [regularizations, setRegularizations] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "", type: "company" });
  const [weeklyOffs, setWeeklyOffs] = useState<number[]>(org?.weekly_offs || [0]);
  const [dailyWagesEnabled, setDailyWagesEnabled] = useState<boolean>(!!(org as any)?.daily_wages_enabled);
  const [enableIndividualWeekOffs, setEnableIndividualWeekOffs] = useState<boolean>(!!(org as any)?.enable_individual_week_offs);
  const [dailyDate, setDailyDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dailyLogs, setDailyLogs] = useState<Record<string, any>>({});
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Manual Punch Dialog for HR (wagers or any staff)
  const [manualPunchEmp, setManualPunchEmp] = useState<any | null>(null);
  const [manualPunchIn, setManualPunchIn] = useState("09:00");
  const [manualPunchOut, setManualPunchOut] = useState("18:00");
  const [savingManualPunch, setSavingManualPunch] = useState(false);

  // approved leaves per employee per date: empId|date -> leaveType
  const [approvedLeaveMap, setApprovedLeaveMap] = useState<Record<string, string>>({});
  // employee shifts: empId -> shift
  const [empShiftMap, setEmpShiftMap] = useState<Record<string, any>>({});
  // auto-computed att keys (not manually set by HR)
  const [autoAttKeys, setAutoAttKeys] = useState<Set<string>>(new Set());

  // Employee Detail Dialog
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<any | null>(null);
  const [detailFrom, setDetailFrom] = useState(() => format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [detailTo, setDetailTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [detailRecords, setDetailRecords] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // --- HR Chat state ---
  const [hrEmployee, setHrEmployee] = useState<any>(null);
  const [chatSelectedEmp, setChatSelectedEmp] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});

  const fetchDailyLogs = async (dateStr: string) => {
    if (!org?.id) return;
    setLoadingDaily(true);
    const { data } = await (supabase as any)
      .from("attendances")
      .select("*")
      .eq("org_id", org.id)
      .eq("date", dateStr);

    const map: Record<string, any> = {};
    (data || []).forEach((r: any) => { map[r.employee_id] = r; });
    setDailyLogs(map);
    setLoadingDaily(false);
  };

  useEffect(() => {
    if (org?.id && dailyDate) {
      fetchDailyLogs(dailyDate);
    }
  }, [org?.id, dailyDate]);

  useEffect(() => {
    if (org) {
      if (org.weekly_offs) setWeeklyOffs(org.weekly_offs);
      setDailyWagesEnabled(!!(org as any).daily_wages_enabled);
      setEnableIndividualWeekOffs(!!(org as any).enable_individual_week_offs);
    }
  }, [org]);

  const monthStart = useMemo(() => startOfMonth(parseISO(month + "-01")), [month]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  // Helper: compute attendance status from clock-in time + shift rules
  const computeShiftStatus = (clockInTime: string, shift: any, defaultShift?: any): Status => {
    if (!clockInTime) return "absent";
    const d = new Date(clockInTime);
    const clockInMins = d.getHours() * 60 + d.getMinutes();
    
    // Effective shift: employee shift -> org default shift -> office default
    const effectiveShift = shift || defaultShift || {
      start_time: "09:00",
      grace_minutes: 15,
      late_end: "10:30",
      half_day_end: "14:00"
    };

    const toMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.slice(0, 5).split(":").map(Number);
      return h * 60 + m;
    };
    const graceEnd = toMins(effectiveShift.start_time || "09:00") + (effectiveShift.grace_minutes ?? 15);
    const lateEnd  = toMins(effectiveShift.late_end  || "10:30");
    const halfEnd  = toMins(effectiveShift.half_day_end || "14:00");

    if (clockInMins <= graceEnd) return "present";
    if (clockInMins <= lateEnd)  return "late";
    if (clockInMins <= halfEnd)  return "half_day";
    return "absent";
  };

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [emps, atts, leavesData, holsRes, clockins, empShiftsRes, regRes, allShiftsRes] = await Promise.all([
      (supabase as any).from("employees").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
      (supabase as any).from("attendance").select("*").eq("org_id", org.id)
        .gte("attendance_date", format(monthStart, "yyyy-MM-dd"))
        .lte("attendance_date", format(monthEnd, "yyyy-MM-dd")),
      (supabase as any).from("leaves").select("*, employees(name)").eq("org_id", org.id).order('created_at', { ascending: false }),
      (supabase as any).from("holidays").select("*").eq("org_id", org.id).order("date", { ascending: true }),
      (supabase as any).from("attendances").select("*").eq("org_id", org.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd")),
      (supabase as any).from("employee_shifts").select("*, shifts(*)").eq("org_id", org.id),
      (supabase as any).from("attendance_regularizations").select("*, employees(name, designation, auth_user_id)").eq("org_id", org.id).order('created_at', { ascending: false }),
      (supabase as any).from("shifts").select("*").eq("org_id", org.id).order("is_default", { ascending: false }),
    ]);
    if (emps.error) toast({ title: "Failed to load employees", description: emps.error.message, variant: "destructive" });

    const empList: any[] = emps.data || [];
    setEmployees(empList);
    setRegularizations(regRes?.data || []);

    const orgShiftsList = allShiftsRes?.data || [];
    const orgDefaultShift = orgShiftsList.find((s: any) => s.is_default) || orgShiftsList[0] || null;

    // HR manually set records
    const map: Record<string, Status> = {};
    (atts.data || []).forEach((r: any) => { map[`${r.employee_id}|${r.attendance_date}`] = r.status; });
    
    const clkMap: Record<string, any> = {};
    (clockins?.data || []).forEach((r: any) => { clkMap[`${r.employee_id}|${r.date}`] = r; });

    // Build approved leave map: empId|date -> leaveType
    const approvedLeaves = (leavesData?.data || []).filter((l: any) => l.status === "approved");
    const alvMap: Record<string, string> = {};
    approvedLeaves.forEach((l: any) => {
      try {
        const start = parseISO(l.start_date);
        const end = parseISO(l.end_date);
        const interval = eachDayOfInterval({ start, end });
        interval.forEach((d) => {
          const ds = format(d, "yyyy-MM-dd");
          alvMap[`${l.employee_id}|${ds}`] = l.leave_type;
        });
      } catch {}
    });

    // Build emp -> shift map
    const shiftMap: Record<string, any> = {};
    (empShiftsRes?.data || []).forEach((es: any) => { shiftMap[es.employee_id] = es.shifts; });

    // ── AUTO-COMPUTE: fill in attendance from clock-in data ──
    const orgWeeklyOffs = (org as any)?.weekly_offs || [0];
    const holsList: any[] = holsRes?.data || [];
    const newAutoKeys = new Set<string>();
    const todayStr = format(new Date(), "yyyy-MM-dd");

    empList.forEach((emp) => {
      eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((d) => {
        const ds = format(d, "yyyy-MM-dd");
        const key = `${emp.id}|${ds}`;
        if (map[key]) return; // HR already set this → skip

        const effectiveWeeklyOffs = ((org as any)?.enable_individual_week_offs && Array.isArray(emp.weekly_offs) && emp.weekly_offs.length > 0)
          ? emp.weekly_offs
          : orgWeeklyOffs;
        const isOff = effectiveWeeklyOffs.includes(d.getDay());
        const isHoliday = holsList.some((h: any) => h.date === ds);
        if (isOff || isHoliday) { map[key] = "holiday"; return; }

        const approvedLeaveType = alvMap[key];
        if (approvedLeaveType) { map[key] = "paid_leave"; return; }

        const clk = clkMap[key];
        if (clk?.clock_in_time) {
          const shift = shiftMap[emp.id] || orgDefaultShift;
          map[key] = computeShiftStatus(clk.clock_in_time, shift, orgDefaultShift);
          newAutoKeys.add(key);
        } else if (ds <= todayStr) {
          // Employee has not marked attendance for past or today -> auto mark absent
          map[key] = "absent";
          newAutoKeys.add(key);
        }
      });
    });

    setAtt(map);
    setAutoAttKeys(newAutoKeys);
    setClockData(clkMap);
    setRawAtt(atts.data || []);
    setLeaves(leavesData?.data || []);
    setHolidays(holsRes?.data || []);
    setApprovedLeaveMap(alvMap);
    setEmpShiftMap(shiftMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, [org?.id, month]);

  // --- HR Chat: load HR's employee record ---
  useEffect(() => {
    const loadHrEmployee = async () => {
      if (!org?.id) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("employees")
        .select("*")
        .eq("org_id", org.id)
        .eq("auth_user_id", user.id)
        .single();
      setHrEmployee(data || null);
    };
    loadHrEmployee();
  }, [org?.id]);

  // --- HR Chat: load unread counts for sidebar badges ---
  const loadUnreadCounts = async () => {
    if (!hrEmployee) return;
    const { data } = await (supabase as any)
      .from("chat_messages")
      .select("sender_id")
      .eq("receiver_id", hrEmployee.id)
      .eq("status", "sent");
    const counts: Record<string, number> = {};
    (data || []).forEach((m: any) => {
      counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
    });
    setUnreadMap(counts);
  };

  useEffect(() => {
    if (hrEmployee) loadUnreadCounts();
  }, [hrEmployee]);

  // --- HR Chat: load messages for selected employee ---
  useEffect(() => {
    if (!hrEmployee || !chatSelectedEmp) { setChatMessages([]); return; }
    const loadMsgs = async () => {
      setChatLoading(true);
      const { data } = await (supabase as any)
        .from("chat_messages")
        .select("*, sender:employees!sender_id(id, name)")
        .or(
          `and(sender_id.eq.${hrEmployee.id},receiver_id.eq.${chatSelectedEmp.id}),and(sender_id.eq.${chatSelectedEmp.id},receiver_id.eq.${hrEmployee.id})`
        )
        .order("created_at", { ascending: true });
      setChatMessages(data || []);
      // Mark as read
      await (supabase as any)
        .from("chat_messages")
        .update({ status: "read" })
        .eq("sender_id", chatSelectedEmp.id)
        .eq("receiver_id", hrEmployee.id)
        .eq("status", "sent");
      setUnreadMap((prev) => ({ ...prev, [chatSelectedEmp.id]: 0 }));
      setChatLoading(false);
    };
    loadMsgs();
  }, [hrEmployee, chatSelectedEmp]);

  // --- HR Chat: scroll to bottom ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // --- HR Chat: realtime subscription ---
  useEffect(() => {
    if (!hrEmployee) return;
    const channel = supabase
      .channel("hr-chat-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        async (payload) => {
          const msg = payload.new as any;
          const isForHR =
            msg.receiver_id === hrEmployee.id || msg.sender_id === hrEmployee.id;
          if (!isForHR || msg.group_id) return;

          const otherId =
            msg.sender_id === hrEmployee.id ? msg.receiver_id : msg.sender_id;

          if (chatSelectedEmp && otherId === chatSelectedEmp.id) {
            // Fetch sender name
            const { data: senderData } = await (supabase as any)
              .from("employees")
              .select("id, name")
              .eq("id", msg.sender_id)
              .single();
            setChatMessages((prev) => [
              ...prev,
              { ...msg, sender: senderData },
            ]);
            // Mark as read immediately
            if (msg.sender_id !== hrEmployee.id) {
              await (supabase as any)
                .from("chat_messages")
                .update({ status: "read" })
                .eq("id", msg.id);
            }
          } else if (msg.sender_id !== hrEmployee.id) {
            // Update unread badge
            setUnreadMap((prev) => ({
              ...prev,
              [msg.sender_id]: (prev[msg.sender_id] || 0) + 1,
            }));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hrEmployee, chatSelectedEmp]);

  // --- HR Chat: send message ---
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !hrEmployee || !chatSelectedEmp) return;
    setChatSending(true);
    try {
      // Ensure connection exists (accept any pending one or create accepted)
      const { data: existingConn } = await (supabase as any)
        .from("chat_connections")
        .select("*")
        .or(
          `and(sender_id.eq.${hrEmployee.id},receiver_id.eq.${chatSelectedEmp.id}),and(sender_id.eq.${chatSelectedEmp.id},receiver_id.eq.${hrEmployee.id})`
        )
        .single();

      if (!existingConn) {
        await (supabase as any).from("chat_connections").insert({
          org_id: hrEmployee.org_id,
          sender_id: hrEmployee.id,
          receiver_id: chatSelectedEmp.id,
          status: "accepted",
        });
      } else if (existingConn.status === "pending") {
        await (supabase as any)
          .from("chat_connections")
          .update({ status: "accepted" })
          .eq("id", existingConn.id);
      }

      await (supabase as any).from("chat_messages").insert({
        org_id: hrEmployee.org_id,
        sender_id: hrEmployee.id,
        receiver_id: chatSelectedEmp.id,
        message: chatInput.trim(),
        status: "sent",
      });
      setChatInput("");
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setChatSending(false);
    }
  };

  // --- Employee Detail Dialog Logic ---
  useEffect(() => {
    const fetchEmployeeDetail = async () => {
      if (!selectedEmpDetail || !org?.id || !detailFrom || !detailTo) return;
      setLoadingDetail(true);
      
      const [atts, clockins] = await Promise.all([
        (supabase as any).from("attendance").select("*")
          .eq("org_id", org.id)
          .eq("employee_id", selectedEmpDetail.id)
          .gte("attendance_date", detailFrom)
          .lte("attendance_date", detailTo),
        (supabase as any).from("attendances").select("*")
          .eq("org_id", org.id)
          .eq("employee_id", selectedEmpDetail.id)
          .gte("date", detailFrom)
          .lte("date", detailTo)
      ]);
      
      const rangeDays = eachDayOfInterval({ start: parseISO(detailFrom), end: parseISO(detailTo) });
      const attMap: Record<string, string> = {};
      (atts.data || []).forEach((r: any) => { attMap[r.attendance_date] = r.status; });
      const clkMap: Record<string, any> = {};
      (clockins.data || []).forEach((r: any) => { clkMap[r.date] = r; });
      const shift = empShiftMap[selectedEmpDetail.id];
      const orgWeeklyOffs = org?.weekly_offs || [0];
      
      const records = rangeDays.map((d) => {
        const ds = format(d, "yyyy-MM-dd");
        const effectiveWeeklyOffs = ((org as any)?.enable_individual_week_offs && Array.isArray(selectedEmpDetail.weekly_offs) && selectedEmpDetail.weekly_offs.length > 0)
          ? selectedEmpDetail.weekly_offs
          : orgWeeklyOffs;
        const isOff = effectiveWeeklyOffs.includes(d.getDay());
        const isHoliday = holidays.some(h => h.date === ds);
        const approvedLeave = approvedLeaveMap[`${selectedEmpDetail.id}|${ds}`];
        const clk = clkMap[ds];
        const hrStatus = attMap[ds];
        
        let finalStatus = "—";
        let isAuto = false;
        
        if (hrStatus) {
          finalStatus = hrStatus;
        } else if (isHoliday || isOff) {
          finalStatus = "holiday";
        } else if (approvedLeave && !clk?.clock_in_time) {
          finalStatus = "approved_leave";
        } else if (clk?.clock_in_time) {
          finalStatus = computeShiftStatus(clk.clock_in_time, shift);
          isAuto = true;
        } else if (ds <= format(new Date(), "yyyy-MM-dd")) {
          // past day without clock-in or HR record
          finalStatus = "absent";
          isAuto = true;
        }
        
        return {
          date: ds,
          dayName: format(d, "EEE"),
          status: finalStatus,
          isAuto,
          clockIn: clk?.clock_in_time,
          clockOut: clk?.clock_out_time,
          locationIn: clk?.clock_in_location,
          locationOut: clk?.clock_out_location,
          approvedLeave
        };
      });
      
      setDetailRecords(records.reverse()); // most recent first
      setLoadingDetail(false);
    };
    fetchEmployeeDetail();
  }, [selectedEmpDetail, detailFrom, detailTo]);

  const setCell = (empId: string, dateStr: string, status: Status) => {
    setAtt((prev) => ({ ...prev, [`${empId}|${dateStr}`]: status }));
  };

  const cycle = (empId: string, dateStr: string) => {
    const d = parseISO(dateStr);
    const orgWeeklyOffs = org?.weekly_offs || [0];
    const isOff = orgWeeklyOffs.includes(d.getDay());
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const current = att[`${empId}|${dateStr}`] || (isOff ? "holiday" : (dateStr <= todayStr ? "absent" : "present"));
    const idx = STATUS_OPTIONS.findIndex((s) => s.value === current);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length].value;
    setCell(empId, dateStr, next);
  };

  const markRowAll = (empId: string, status: Status) => {
    setAtt((prev) => {
      const next = { ...prev };
      days.forEach((d) => { next[`${empId}|${format(d, "yyyy-MM-dd")}`] = status; });
      return next;
    });
  };

  const save = async () => {
    if (!org?.id) return;
    setSaving(true);
    const rows: any[] = [];
    Object.entries(att).forEach(([k, status]) => {
      const [employee_id, attendance_date] = k.split("|");
      if (employees.find((e) => e.id === employee_id)) {
        rows.push({ org_id: org.id, employee_id, attendance_date, status });
      }
    });
    if (rows.length === 0) { setSaving(false); toast({ title: "Nothing to save" }); return; }
    const { error } = await (supabase as any).from("attendance").upsert(rows, { onConflict: "employee_id,attendance_date" });
    if (error) {
      setSaving(false);
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    setSaving(false);
    toast({ title: "Attendance saved", description: `${rows.length} record(s) saved.` });
  };

  // Summaries
  const summaries = useMemo(() => {
    const orgWeeklyOffs = org?.weekly_offs || [0];
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return employees.map((emp) => {
      let p = 0, a = 0, h = 0, pl = 0, ho = 0;
      days.forEach((d) => {
        const ds = format(d, "yyyy-MM-dd");
        const isOff = orgWeeklyOffs.includes(d.getDay());
        const s = att[`${emp.id}|${ds}`] || (isOff ? "holiday" : (ds <= todayStr ? "absent" : undefined));
        if (s === "present") p++;
        else if (s === "absent") a++;
        else if (s === "half_day") h++;
        else if (s === "paid_leave") pl++;
        else if (s === "holiday") ho++;
      });
      const workingDays = days.length - ho;
      // Payable units: present=1, half=0.5, paid_leave=1 (within allowance), extra paid_leave treated as absent
      const allowedPL = emp.paid_leaves_per_month;
      const paidPL = Math.min(pl, allowedPL);
      const unpaidPL = Math.max(0, pl - allowedPL);
      const payableDays = p + h * 0.5 + paidPL; // unpaid_pl deducted (treated as absent)
      const perDay = workingDays > 0 ? emp.monthly_salary / workingDays : 0;
      const payable = perDay * payableDays;
      return { emp, p, a: a + unpaidPL, h, pl: paidPL, ho, workingDays, payableDays, payable };
    });
  }, [employees, days, att]);

  const totalPayable = summaries.reduce((s, r) => s + r.payable, 0);

  const postToExpenses = async () => {
    if (!org?.id) return;
    if (summaries.length === 0) return;
    if (!confirm(`Post ${formatCurrency(totalPayable, (org as any)?.currency || "INR")} as salary expense for ${format(monthStart, "MMM yyyy")}?`)) return;
    setPosting(true);
    const rows = summaries
      .filter((s) => s.payable > 0)
      .map((s) => ({
        org_id: org.id,
        category: "Salary",
        description: `Salary — ${s.emp.name} (${format(monthStart, "MMM yyyy")})`,
        amount: Number(s.payable.toFixed(2)),
        expense_date: format(monthEnd, "yyyy-MM-dd"),
        is_recurring: false,
        recurring_frequency: null,
      }));
    if (rows.length === 0) { setPosting(false); return; }
    const { error } = await (supabase as any).from("business_expenses").insert(rows);
    setPosting(false);
    if (error) toast({ title: "Failed to post", description: error.message, variant: "destructive" });
    else toast({ title: "Salaries posted to Expenses", description: `${rows.length} entries added.` });
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() + delta);
    setMonth(format(d, "yyyy-MM"));
  };

  const statusBadge = (s: Status | undefined, isAuto?: boolean) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s) || STATUS_OPTIONS[0];
    return (
      <span className={`inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] font-semibold relative ${opt.cls}`}>
        {opt.short}
        {isAuto && <span className="absolute -top-[3px] -right-[3px] flex h-2 w-2 rounded-full bg-blue-500 ring-1 ring-white" title="Auto-computed from clock-in"></span>}
      </span>
    );
  };

  const updateLeaveStatus = async (id: string, newStatus: string) => {
    const { error } = await (supabase as any).from("leaves").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: `Leave request ${newStatus}.` });
      load();
    }
  };

  const updateRegularizationStatus = async (reg: any, newStatus: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("attendance_regularizations")
        .update({ status: newStatus, approved_by: user?.id || null })
        .eq("id", reg.id);

      if (error) throw error;

      if (newStatus === 'approved') {
        // Upsert attendances table (daily clock records)
        await (supabase as any).from("attendances").upsert({
          org_id: org.id,
          employee_id: reg.employee_id,
          date: reg.date,
          clock_in_time: reg.requested_clock_in,
          clock_out_time: reg.requested_clock_out,
          status: 'present'
        }, { onConflict: 'employee_id,date' });

        // Upsert attendance table (HR monthly calendar record)
        await (supabase as any).from("attendance").upsert({
          org_id: org.id,
          employee_id: reg.employee_id,
          attendance_date: reg.date,
          status: 'present'
        }, { onConflict: 'employee_id,attendance_date' });
      }

      // Send notification to employee
      if (reg.employees?.auth_user_id) {
        try {
          await (supabase as any).from("notifications").insert({
            org_id: org.id,
            user_id: reg.employees.auth_user_id,
            title: `Regularization ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
            message: `Your attendance regularization request for ${reg.date} has been ${newStatus}.`,
            type: newStatus === 'approved' ? 'regularization_approved' : 'regularization_rejected'
          });
        } catch {}
      }

      toast({ 
        title: `Regularization ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`, 
        description: `Attendance for ${reg.employees?.name || 'employee'} on ${reg.date} has been updated.` 
      });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const addHoliday = async (h: { name: string; date: string; type: string }) => {
    if (!org?.id) return;
    if (!h.name || !h.date) {
      toast({ title: "Error", description: "Name and date are required.", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("holidays").insert({
      org_id: org.id,
      name: h.name,
      date: h.date,
      type: h.type
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Holiday Added", description: `${h.name} added to calendar.` });
      setNewHoliday({ name: "", date: "", type: "company" });
      load();
    }
  };

  const removeHoliday = async (id: string) => {
    const { error } = await (supabase as any).from("holidays").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Holiday removed from calendar." });
      load();
    }
  };

  const saveSettings = async () => {
    if (!org?.id) return;
    const { error } = await (supabase as any).from("organizations").update({
      weekly_offs: weeklyOffs,
      daily_wages_enabled: dailyWagesEnabled,
      enable_individual_week_offs: enableIndividualWeekOffs,
    }).eq("id", org.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings Saved", description: "Attendance & Wages settings updated successfully." });
      setOrganization({ ...org, weekly_offs: weeklyOffs, daily_wages_enabled: dailyWagesEnabled, enable_individual_week_offs: enableIndividualWeekOffs } as any);
    }
  };

  const handleSaveManualPunch = async () => {
    if (!org?.id || !manualPunchEmp || !dailyDate) return;
    // Prevent saving attendance for future dates
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (dailyDate > todayStr) {
      toast({ title: "Future date not allowed", description: "Attendance can only be recorded for today or past dates.", variant: "destructive" });
      return;
    }
    setSavingManualPunch(true);
    try {
      const clockInIso = manualPunchIn ? `${dailyDate}T${manualPunchIn}:00` : null;
      const clockOutIso = manualPunchOut ? `${dailyDate}T${manualPunchOut}:00` : null;

      const existing = dailyLogs[manualPunchEmp.id];
      if (existing?.id) {
        const { error } = await (supabase as any).from("attendances").update({
          clock_in_time: clockInIso,
          clock_out_time: clockOutIso,
          status: "present",
        }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("attendances").insert({
          org_id: org.id,
          employee_id: manualPunchEmp.id,
          date: dailyDate,
          clock_in_time: clockInIso,
          clock_out_time: clockOutIso,
          status: "present",
        });
        if (error) throw error;
      }
      toast({ title: "Punch Recorded", description: `Saved check-in / check-out time for ${manualPunchEmp.name}` });
      setManualPunchEmp(null);
      fetchDailyLogs(dailyDate);
    } catch (err: any) {
      toast({ title: "Failed to record punch", description: err.message, variant: "destructive" });
    } finally {
      setSavingManualPunch(false);
    }
  };

  const formatTime = (iso: string) => format(parseISO(iso), "hh:mm a");

  const calculateHours = (inTime: string, outTime: string) => {
    try {
      const start = new Date(inTime).getTime();
      const end = new Date(outTime).getTime();
      const diffMs = end - start;
      if (isNaN(diffMs) || diffMs <= 0) return "-";
      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hrs}h ${mins}m`;
    } catch {
      return "-";
    }
  };

  const renderLocation = (loc: any) => {
    if (!loc) return <span className="text-xs text-muted-foreground">-</span>;
    const addressText = loc.address || loc.name || (loc.lat && loc.lng ? `${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}` : null);
    const mapUrl = loc.lat && loc.lng ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : null;
    
    return (
      <div className="flex flex-col text-xs space-y-0.5">
        <span className="font-medium text-slate-700 max-w-[200px] truncate" title={addressText || "Location Captured"}>
          {addressText || "GPS Recorded"}
        </span>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold text-[11px]"
          >
            <MapPin className="w-3 h-3 text-blue-500" /> View Map
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {selectedClockInfo && (
        <Dialog open={!!selectedClockInfo} onOpenChange={(o) => !o && setSelectedClockInfo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendance Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(parseISO(selectedClockInfo.date), "MMMM dd, yyyy")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{selectedClockInfo.status || 'Present'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 p-3 bg-slate-50 rounded border">
                  <p className="text-sm font-semibold flex items-center gap-1"><Clock className="w-4 h-4 text-green-600"/> Clock In</p>
                  {selectedClockInfo.clock_in_time ? (
                    <>
                      <p className="text-sm">{formatTime(selectedClockInfo.clock_in_time)}</p>
                      {selectedClockInfo.clock_in_location && (
                        <a href={`https://maps.google.com/?q=${selectedClockInfo.clock_in_location.lat},${selectedClockInfo.clock_in_location.lng}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center hover:underline mt-1">
                          <MapPin className="w-3 h-3 mr-1" /> View on Map
                        </a>
                      )}
                    </>
                  ) : <p className="text-xs text-muted-foreground">Not recorded</p>}
                </div>
                
                <div className="space-y-2 p-3 bg-slate-50 rounded border">
                  <p className="text-sm font-semibold flex items-center gap-1"><Clock className="w-4 h-4 text-orange-600"/> Clock Out</p>
                  {selectedClockInfo.clock_out_time ? (
                    <>
                      <p className="text-sm">{formatTime(selectedClockInfo.clock_out_time)}</p>
                      {selectedClockInfo.clock_out_location && (
                        <a href={`https://maps.google.com/?q=${selectedClockInfo.clock_out_location.lat},${selectedClockInfo.clock_out_location.lng}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 flex items-center hover:underline mt-1">
                          <MapPin className="w-3 h-3 mr-1" /> View on Map
                        </a>
                      )}
                    </>
                  ) : <p className="text-xs text-muted-foreground">Not recorded</p>}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Punch In / Out Time Setting Dialog */}
      {manualPunchEmp && (
        <Dialog open={!!manualPunchEmp} onOpenChange={(o) => !o && setManualPunchEmp(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Set Daily Clock In & Out Time
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 p-3 rounded-lg border">
                <p className="text-sm font-semibold text-slate-800">{manualPunchEmp.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>Date: <strong className="text-slate-700">{format(parseISO(dailyDate), "dd MMM yyyy")}</strong></span>
                  {(manualPunchEmp as any).wage_type === "daily" && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px]">Daily Wager (₹{(manualPunchEmp as any).daily_rate || (manualPunchEmp as any).monthly_salary}/day)</Badge>
                  )}
                  {(manualPunchEmp as any).wage_type === "hourly" && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 text-[10px]">Hourly Wager (₹{(manualPunchEmp as any).hourly_rate}/hr)</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Clock In Time</Label>
                  <Input
                    type="time"
                    value={manualPunchIn}
                    onChange={(e) => setManualPunchIn(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Clock Out Time</Label>
                  <Input
                    type="time"
                    value={manualPunchOut}
                    onChange={(e) => setManualPunchOut(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {manualPunchIn && manualPunchOut && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
                  <span>Computed Working Hours:</span>
                  <span className="font-bold font-mono text-sm">
                    {(() => {
                      try {
                        const [inH, inM] = manualPunchIn.split(":").map(Number);
                        const [outH, outM] = manualPunchOut.split(":").map(Number);
                        const diffMins = (outH * 60 + outM) - (inH * 60 + inM);
                        if (diffMins > 0) {
                          const h = Math.floor(diffMins / 60);
                          const m = diffMins % 60;
                          return `${h}h ${m}m (${(diffMins / 60).toFixed(2)} hrs)`;
                        }
                        return "Invalid time range";
                      } catch {
                        return "-";
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setManualPunchEmp(null)}>Cancel</Button>
              <Button onClick={handleSaveManualPunch} disabled={savingManualPunch}>
                <Save className="w-4 h-4 mr-1.5" />
                {savingManualPunch ? "Saving..." : "Save Punch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Click a cell to cycle: Present → Absent → Half → Paid Leave → Holiday.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild><NavLink to="/employees">Employees</NavLink></Button>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}><ChevronRight className="h-4 w-4" /></Button>
          <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {STATUS_OPTIONS.map((o) => (
          <span key={o.value} className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${o.cls}`}>
            <span className="font-semibold">{o.short}</span>{o.label}
          </span>
        ))}
      </div>

      
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="roster">Roster Planner</TabsTrigger>
          <TabsTrigger value="daily">Daily Clock Logs</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
          <TabsTrigger value="regularizations" className="flex items-center gap-1.5">
            Regularizations
            {regularizations.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {regularizations.filter(r => r.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="salaries" className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <Calculator className="w-4 h-4" />
            Salaries & Calculation
          </TabsTrigger>
          <TabsTrigger value="holidays">Company Holidays</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="hr-chat" className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            HR Chat
            {Object.values(unreadMap).reduce((a, b) => a + b, 0) > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {Object.values(unreadMap).reduce((a, b) => a + b, 0)}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-4">
<Card>
        <CardContent className="p-0 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No active employees. <NavLink to="/employees" className="text-primary underline">Add one</NavLink>.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Employee</TableHead>
                  {days.map((d) => (
                    <TableHead key={d.toISOString()} className="text-center px-1">
                      <div className="text-[10px] text-muted-foreground">{format(d, "EEE")}</div>
                      <div className="text-xs font-medium">{format(d, "d")}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Bulk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">{emp.name}</TableCell>
                      {days.map((d) => {
                      const ds = format(d, "yyyy-MM-dd");
                      const orgWeeklyOffs = org?.weekly_offs || [0];
                      const isOff = orgWeeklyOffs.includes(d.getDay());
                      const isHoliday = holidays.some((h) => h.date === ds);
                      const approvedLeaveType = approvedLeaveMap[`${emp.id}|${ds}`];
                      const recordedStatus = att[`${emp.id}|${ds}`];
                      const c = clockData[`${emp.id}|${ds}`];

                      const todayStr = format(new Date(), "yyyy-MM-dd");

                      // Determine display status — unrecorded days on or before today automatically show as Absent
                      let displayStatus: Status | "approved_leave" | null = null;
                      if (recordedStatus) {
                        displayStatus = recordedStatus as Status;
                      } else if (isHoliday || isOff) {
                        displayStatus = "holiday";
                      } else if (approvedLeaveType) {
                        displayStatus = "approved_leave" as any;
                      } else if (ds <= todayStr) {
                        displayStatus = "absent";
                      }

                      const isAL = displayStatus === "approved_leave";
                      return (
                        <TableCell key={ds} className="text-center p-1 relative group">
                          <button
                            onClick={() => {
                              if (isHoliday || isOff) return; // don't cycle holidays/weekoffs
                              cycle(emp.id, ds);
                            }}
                            title={ds}
                          >
                            {isAL ? (
                              <span className="inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] font-semibold bg-purple-100 text-purple-700 border-purple-300" title={`Approved ${approvedLeaveType} leave`}>AL</span>
                            ) : displayStatus ? (
                              statusBadge(displayStatus as Status, autoAttKeys.has(`${emp.id}|${ds}`))
                            ) : (
                              <span className="inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] text-muted-foreground border-dashed">—</span>
                            )}
                          </button>
                          {c && (
                            <button onClick={() => setSelectedClockInfo(c)} className="absolute top-0 right-0 p-0.5 text-blue-500 hover:text-blue-700 bg-white rounded-full shadow-sm opacity-80 hover:opacity-100" title="View details">
                              <MapPin className="w-3 h-3" />
                            </button>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Select onValueChange={(v) => markRowAll(emp.id, v as Status)}>
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder="Mark all" /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>All {o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {employees.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monthly Summary — {format(monthStart, "MMMM yyyy")}</CardTitle>
            <Button onClick={postToExpenses} disabled={posting} variant="default">
              <Send className="h-4 w-4 mr-2" />{posting ? "Posting…" : "Post Salaries to Expenses"}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Half</TableHead>
                  <TableHead className="text-center">Paid Leave</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Holiday</TableHead>
                  <TableHead className="text-right">Payable Days</TableHead>
                  <TableHead className="text-right">Monthly Salary</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((r) => (
                  <TableRow key={r.emp.id}>
                    <TableCell className="font-medium">{r.emp.name}</TableCell>
                    <TableCell className="text-center">{r.p}</TableCell>
                    <TableCell className="text-center">{r.h}</TableCell>
                    <TableCell className="text-center">{r.pl}</TableCell>
                    <TableCell className="text-center">{r.a}</TableCell>
                    <TableCell className="text-center">{r.ho}</TableCell>
                    <TableCell className="text-right">{r.payableDays.toFixed(1)} / {r.workingDays}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.emp.monthly_salary, (org as any)?.currency || "INR")}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(r.payable, (org as any)?.currency || "INR")}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={8} className="text-right font-semibold">Total Payable</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatCurrency(totalPayable, (org as any)?.currency || "INR")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      </TabsContent>

      <TabsContent value="roster" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Roster Planner (Future Dates)</CardTitle>
            <p className="text-sm text-muted-foreground">Plan rotational week-offs by clicking a cell to toggle it as a "Week Off". Don't forget to click Save at the top!</p>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No active employees.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Employee</TableHead>
                    {days.map((d) => (
                      <TableHead key={d.toISOString()} className="text-center px-1">
                        <div className="text-[10px] text-muted-foreground">{format(d, "EEE")}</div>
                        <div className="text-xs font-medium">{format(d, "d")}</div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">{emp.name}</TableCell>
                        {days.map((d) => {
                        const ds = format(d, "yyyy-MM-dd");
                        const recordedStatus = att[`${emp.id}|${ds}`];
                        const orgWeeklyOffs = org?.weekly_offs || [0];
                        
                        // Effective weekly offs from profile
                        const effectiveWeeklyOffs = ((org as any)?.enable_individual_week_offs && Array.isArray(emp.weekly_offs) && emp.weekly_offs.length > 0)
                          ? emp.weekly_offs
                          : orgWeeklyOffs;

                        const isDefaultOff = effectiveWeeklyOffs.includes(d.getDay());
                        const isHoliday = holidays.some((h) => h.date === ds);
                        
                        // Current displayed state
                        const isRosterOff = recordedStatus === "holiday" || (!recordedStatus && (isDefaultOff || isHoliday));

                        return (
                          <TableCell key={ds} className="text-center p-1 relative">
                            <button
                              onClick={() => {
                                // In Roster, we only care about setting Holiday or "Working" (present)
                                const nextStatus = isRosterOff ? "present" : "holiday";
                                setCell(emp.id, ds, nextStatus);
                              }}
                              title={ds}
                              className={`h-6 w-8 rounded border text-[10px] font-semibold flex items-center justify-center transition-all ${
                                isRosterOff ? "bg-slate-200 text-slate-700 border-slate-300 shadow-sm" : "bg-white text-slate-300 border-dashed hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-500"
                              }`}
                            >
                              {isRosterOff ? "OFF" : "+"}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="daily" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold">Daily Attendance & Location Logs</h3>
              <p className="text-xs text-muted-foreground">View check-in time, check-out time, working hours and GPS location for all employees for any selected date.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Select Date:</span>
            <Input
              type="date"
              value={dailyDate}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDailyDate(e.target.value)}
              className="w-44"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-50">
            <p className="text-xs font-medium text-muted-foreground">Total Staff</p>
            <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <p className="text-xs font-medium text-emerald-700">Clocked In</p>
            <p className="text-2xl font-bold text-emerald-800">
              {employees.filter(e => dailyLogs[e.id]?.clock_in_time).length}
            </p>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-xs font-medium text-amber-700">Clocked Out</p>
            <p className="text-2xl font-bold text-amber-800">
              {employees.filter(e => dailyLogs[e.id]?.clock_out_time).length}
            </p>
          </Card>
          <Card className="p-4 bg-rose-50 border-rose-200">
            <p className="text-xs font-medium text-rose-700">Pending / Not Clocked In</p>
            <p className="text-2xl font-bold text-rose-800">
              {employees.filter(e => !dailyLogs[e.id]?.clock_in_time).length}
            </p>
          </Card>
        </div>

        {/* Inner Sub-tabs */}
        <Tabs defaultValue="all-staff">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="all-staff" className="text-xs font-medium">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              All Staff Logs
            </TabsTrigger>
            <TabsTrigger value="wager-punch" className="text-xs font-medium">
              <HardHat className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Daily / Hourly Wager Punches
              {employees.filter(e => (e as any).wage_type === 'daily' || (e as any).wage_type === 'hourly').length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white">
                  {employees.filter(e => (e as any).wage_type === 'daily' || (e as any).wage_type === 'hourly').length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ---- All Staff Tab ---- */}
          <TabsContent value="all-staff" className="mt-3">
            <Card>
              <CardContent className="p-0 overflow-auto">
                {loadingDaily ? (
                  <div className="p-8 text-center text-muted-foreground">Loading attendance logs...</div>
                ) : employees.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No active employees found.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/80">
                        <TableHead className="font-semibold">Employee</TableHead>
                        <TableHead className="font-semibold">Shift</TableHead>
                        <TableHead className="font-semibold text-center">Computed Status</TableHead>
                        <TableHead className="font-semibold">Clock In Time</TableHead>
                        <TableHead className="font-semibold">Clock In Location</TableHead>
                        <TableHead className="font-semibold">Clock Out Time</TableHead>
                        <TableHead className="font-semibold">Clock Out Location</TableHead>
                        <TableHead className="font-semibold text-right">Hours Worked</TableHead>
                        <TableHead className="text-right font-semibold">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp) => {
                        const log = dailyLogs[emp.id];
                        const hasClockIn = !!log?.clock_in_time;
                        const hasClockOut = !!log?.clock_out_time;
                        const shift = empShiftMap[emp.id];

                        const computeStatus = (): { label: string; cls: string } => {
                          const isHolidayDay = holidays.some((h) => h.date === dailyDate);
                          if (isHolidayDay) return { label: "Holiday", cls: "bg-slate-100 text-slate-600 border" };
                          const approvedLeave = approvedLeaveMap[`${emp.id}|${dailyDate}`];
                          if (approvedLeave && !hasClockIn) return { label: "Approved Leave", cls: "bg-purple-100 text-purple-700 border-purple-300" };
                          if (!hasClockIn) return { label: "Absent", cls: "bg-red-100 text-red-700 border-red-300" };
                          if (!shift) return { label: "Present", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" };
                          const clockInDate = new Date(log.clock_in_time);
                          const hh = clockInDate.getHours();
                          const mm = clockInDate.getMinutes();
                          const clockInMins = hh * 60 + mm;
                          const toMins = (t: string) => {
                            if (!t) return 0;
                            const [h, m] = t.slice(0, 5).split(":").map(Number);
                            return h * 60 + m;
                          };
                          const graceEnd = toMins(shift.start_time) + (shift.grace_minutes ?? 15);
                          const lateEnd = toMins(shift.late_end || "10:30");
                          const halfDayEnd = toMins(shift.half_day_end || "14:00");
                          if (clockInMins <= graceEnd) return { label: "Present", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" };
                          if (clockInMins <= lateEnd) return { label: "Late", cls: "bg-amber-100 text-amber-800 border-amber-300" };
                          if (clockInMins <= halfDayEnd) return { label: "Half Day", cls: "bg-orange-100 text-orange-800 border-orange-300" };
                          return { label: "Absent", cls: "bg-red-100 text-red-700 border-red-300" };
                        };

                        const statusInfo = computeStatus();

                        return (
                          <TableRow key={emp.id} className="hover:bg-slate-50/60">
                            <TableCell>
                              <button onClick={() => setSelectedEmpDetail(emp)} className="text-left font-medium text-sm text-primary hover:underline">
                                {emp.name}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {(emp as any).employee_code && (
                                  <span className="text-xs text-muted-foreground">{(emp as any).employee_code}</span>
                                )}
                                {(emp as any).wage_type === "daily" && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">Daily Wager</span>
                                )}
                                {(emp as any).wage_type === "hourly" && (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-1.5 py-0.5 rounded">Hourly Wager</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {shift ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  {shift.name} ({shift.start_time?.slice(0,5)}–{shift.end_time?.slice(0,5)})
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">No shift</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.cls}`}>
                                {statusInfo.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              {hasClockIn ? (
                                <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                  {formatTime(log.clock_in_time)}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{renderLocation(log?.clock_in_location)}</TableCell>
                            <TableCell>
                              {hasClockOut ? (
                                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  {formatTime(log.clock_out_time)}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{renderLocation(log?.clock_out_location)}</TableCell>
                            <TableCell className="text-right font-medium text-sm">
                              {hasClockIn && hasClockOut ? calculateHours(log.clock_in_time, log.clock_out_time) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs font-medium gap-1"
                                onClick={() => {
                                  setManualPunchEmp(emp);
                                  if (log?.clock_in_time) {
                                    try { setManualPunchIn(format(new Date(log.clock_in_time), "HH:mm")); } catch {}
                                  } else {
                                    setManualPunchIn("09:00");
                                  }
                                  if (log?.clock_out_time) {
                                    try { setManualPunchOut(format(new Date(log.clock_out_time), "HH:mm")); } catch {}
                                  } else {
                                    setManualPunchOut("18:00");
                                  }
                                }}
                              >
                                <Edit3 className="w-3 h-3 text-primary" />
                                {hasClockIn ? "Edit Punch" : "Set Punch"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---- Daily / Hourly Wager Punch Tab ---- */}
          <TabsContent value="wager-punch" className="mt-3">
            {(() => {
              const wagerEmps = employees.filter(e => (e as any).wage_type === 'daily' || (e as any).wage_type === 'hourly');
              if (wagerEmps.length === 0) {
                return (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <HardHat className="h-12 w-12 text-amber-300 mx-auto mb-3" />
                      <p className="text-base font-semibold text-muted-foreground">No Daily / Hourly Wage Workers found</p>
                      <p className="text-sm text-muted-foreground mt-1">Add daily or hourly wage workers from the <strong>Employees</strong> page first.</p>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Card className="border-amber-200">
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-semibold text-sm text-amber-900">Daily & Hourly Wager Attendance</p>
                        <p className="text-xs text-muted-foreground">Enter check-in & check-out times for each wager worker. Hit <strong>Save</strong> to record.</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                      {format(new Date(dailyDate), "dd MMM yyyy")}
                    </Badge>
                  </div>
                  <CardContent className="p-0 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-amber-50/60">
                          <TableHead className="font-semibold text-amber-900">Worker</TableHead>
                          <TableHead className="font-semibold text-amber-900">Type & Rate</TableHead>
                          <TableHead className="font-semibold text-amber-900 w-44">Check-In Time</TableHead>
                          <TableHead className="font-semibold text-amber-900 w-44">Check-Out Time</TableHead>
                          <TableHead className="font-semibold text-amber-900 text-center w-32">Hours Worked</TableHead>
                          <TableHead className="font-semibold text-amber-900 text-center w-36">Est. Wage Today</TableHead>
                          <TableHead className="font-semibold text-right w-28">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wagerEmps.map((emp) => {
                          const log = dailyLogs[emp.id];
                          const hasClockIn = !!log?.clock_in_time;
                          const hasClockOut = !!log?.clock_out_time;
                          const existingIn = hasClockIn ? format(new Date(log.clock_in_time), "HH:mm") : "";
                          const existingOut = hasClockOut ? format(new Date(log.clock_out_time), "HH:mm") : "";
                          const wageType = (emp as any).wage_type as "daily" | "hourly";
                          const dailyRate = Number((emp as any).daily_rate) || 0;
                          const hourlyRate = Number((emp as any).hourly_rate) || 0;
                          const currency = (org as any)?.currency || "INR";

                          let inInputRef: HTMLInputElement | null = null;
                          let outInputRef: HTMLInputElement | null = null;

                          const calcHrsDecimal = (inT: string, outT: string) => {
                            try {
                              const [ih, im] = inT.split(":").map(Number);
                              const [oh, om] = outT.split(":").map(Number);
                              const diff = (oh * 60 + om) - (ih * 60 + im);
                              return diff > 0 ? diff / 60 : 0;
                            } catch { return 0; }
                          };
                          const hrs = existingIn && existingOut ? calcHrsDecimal(existingIn, existingOut) : 0;
                          const estWage = wageType === "hourly"
                            ? hrs * hourlyRate
                            : hrs >= 6 ? dailyRate : hrs >= 4 ? dailyRate * 0.5 : 0;

                          const handleSavePunch = async () => {
                            // Prevent saving future dates
                            const today = format(new Date(), "yyyy-MM-dd");
                            if (dailyDate > today) {
                              toast({ title: "Future date not allowed", description: "You can only add attendance for today or past dates.", variant: "destructive" });
                              return;
                            }
                            const inEl = document.getElementById(`wpunch-in-${emp.id}`) as HTMLInputElement;
                            const outEl = document.getElementById(`wpunch-out-${emp.id}`) as HTMLInputElement;
                            const inTime = inEl?.value;
                            const outTime = outEl?.value;
                            if (!inTime) {
                              toast({ title: "Clock-In required", description: `Enter check-in time for ${emp.name}`, variant: "destructive" });
                              return;
                            }
                            setSavingManualPunch(true);
                            try {
                              const clockInIso = `${dailyDate}T${inTime}:00`;
                              const clockOutIso = outTime ? `${dailyDate}T${outTime}:00` : null;
                              if (log?.id) {
                                const { error } = await (supabase as any).from("attendances").update({
                                  clock_in_time: clockInIso,
                                  clock_out_time: clockOutIso,
                                  status: "present",
                                }).eq("id", log.id);
                                if (error) throw error;
                              } else {
                                const { error } = await (supabase as any).from("attendances").insert({
                                  org_id: org?.id,
                                  employee_id: emp.id,
                                  date: dailyDate,
                                  clock_in_time: clockInIso,
                                  clock_out_time: clockOutIso,
                                  status: "present",
                                });
                                if (error) throw error;
                              }
                              toast({ title: "Saved!", description: `Punch recorded for ${emp.name}` });
                              fetchDailyLogs(dailyDate);
                            } catch (err: any) {
                              toast({ title: "Failed", description: err.message, variant: "destructive" });
                            } finally {
                              setSavingManualPunch(false);
                            }
                          };

                          return (
                            <TableRow key={emp.id} className={`hover:bg-amber-50/20 ${hasClockIn ? "bg-emerald-50/10" : ""}`}>
                              <TableCell>
                                <button onClick={() => setSelectedEmpDetail(emp)} className="text-left font-semibold text-sm text-amber-900 hover:underline">
                                  {emp.name}
                                </button>
                                {(emp as any).employee_code && (
                                  <div className="text-xs text-muted-foreground">{(emp as any).employee_code}</div>
                                )}
                                {(emp as any).designation && (
                                  <div className="text-xs text-muted-foreground italic">{(emp as any).designation}</div>
                                )}
                                {hasClockIn && (
                                  <div className="mt-0.5">
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">✓ Punched</span>
                                  </div>
                                )}
                              </TableCell>

                              <TableCell>
                                {wageType === "daily" ? (
                                  <div>
                                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] font-bold">Daily Wager</Badge>
                                    <div className="text-xs text-amber-800 font-semibold mt-0.5">{formatCurrency(dailyRate, currency)} / day</div>
                                  </div>
                                ) : (
                                  <div>
                                    <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-300 text-[10px] font-bold">Hourly Wager</Badge>
                                    <div className="text-xs text-purple-800 font-semibold mt-0.5">{formatCurrency(hourlyRate, currency)} / hr</div>
                                  </div>
                                )}
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <Input
                                    id={`wpunch-in-${emp.id}`}
                                    type="time"
                                    defaultValue={existingIn || "09:00"}
                                    className="h-8 text-xs font-mono w-full border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200"
                                  />
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                  <Input
                                    id={`wpunch-out-${emp.id}`}
                                    type="time"
                                    defaultValue={existingOut || "18:00"}
                                    className="h-8 text-xs font-mono w-full border-amber-300 focus:border-amber-500 focus:ring-amber-200"
                                  />
                                </div>
                              </TableCell>

                              <TableCell className="text-center">
                                {hrs > 0 ? (
                                  <span className={`text-xs font-bold ${hrs >= 9 ? "text-emerald-700" : hrs >= 4 ? "text-amber-700" : "text-red-600"}`}>
                                    {Math.floor(hrs)}h {Math.round((hrs % 1) * 60)}m
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              <TableCell className="text-center">
                                {estWage > 0 ? (
                                  <span className="text-xs font-bold text-emerald-800">{formatCurrency(estWage, currency)}</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>

                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1 font-semibold"
                                  onClick={handleSavePunch}
                                  disabled={savingManualPunch}
                                >
                                  <Save className="w-3 h-3" />
                                  {hasClockIn ? "Update" : "Save"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })()}
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="leaves">
        <Card>
          <CardHeader>
            <CardTitle>Employee Leave Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No leave requests found.</TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.employees?.name}</TableCell>
                      <TableCell className="capitalize">{leave.leave_type}</TableCell>
                      <TableCell>
                        {format(parseISO(leave.start_date), 'MMM dd')} - {format(parseISO(leave.end_date), 'MMM dd')} ({leave.days}d)
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {leave.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {leave.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100" onClick={() => updateLeaveStatus(leave.id, 'approved')}>Approve</Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100" onClick={() => updateLeaveStatus(leave.id, 'rejected')}>Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="regularizations">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Regularization Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Requested In</TableHead>
                  <TableHead>Requested Out</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regularizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No regularization requests found.</TableCell>
                  </TableRow>
                ) : (
                  regularizations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        <div>{reg.employees?.name || 'Unknown'}</div>
                        {reg.employees?.designation && (
                          <div className="text-xs text-muted-foreground">{reg.employees.designation}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(parseISO(reg.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {reg.requested_clock_in ? (
                          <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Clock className="w-3 h-3 mr-1 text-emerald-600" />
                            {format(new Date(reg.requested_clock_in), 'hh:mm a')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {reg.requested_clock_out ? (
                          <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                            {format(new Date(reg.requested_clock_out), 'hh:mm a')}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[220px] truncate" title={reg.reason}>
                        {reg.reason}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${reg.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' : reg.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                          {reg.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100" onClick={() => updateRegularizationStatus(reg, 'approved')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100" onClick={() => updateRegularizationStatus(reg, 'rejected')}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="salaries" className="space-y-4">
        <SalariesTab />
      </TabsContent>

      <TabsContent value="holidays" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Custom Holiday</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Holiday Name</label>
                <Input value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} placeholder="e.g. Company Foundation Day" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input type="date" value={newHoliday.date} onChange={e => setNewHoliday({...newHoliday, date: e.target.value})} />
              </div>
              <Button onClick={() => addHoliday(newHoliday)}>Add Holiday</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Standard Indian Festivals (2026)</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-auto border rounded-md p-0">
              <Table>
                <TableBody>
                  {INDIAN_FESTIVALS.map((fest, idx) => {
                    const isAdded = holidays.some(h => h.date === fest.date && h.name === fest.name);
                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="font-medium">{fest.name}</div>
                          <div className="text-xs text-muted-foreground">{format(parseISO(fest.date), "MMM dd, yyyy")}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant={isAdded ? "secondary" : "outline"} 
                            size="sm" 
                            disabled={isAdded}
                            onClick={() => addHoliday(fest)}
                          >
                            {isAdded ? "Added" : "Add"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Calendar ({holidays.length} Holidays)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No holidays added to the company calendar yet.</TableCell>
                  </TableRow>
                ) : (
                  holidays.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell>{format(parseISO(h.date), "MMMM dd, yyyy")} ({format(parseISO(h.date), "EEEE")})</TableCell>
                      <TableCell className="capitalize">{h.type}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => removeHoliday(h.id)}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Attendance & Wages Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Daily & Hourly Wages Workers Toggle */}
            <div className="flex items-start justify-between p-4 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-600" />
                  <Label htmlFor="daily-wages-toggle" className="text-base font-semibold cursor-pointer">
                    Daily & Hourly Wages Workers
                  </Label>
                  <Badge variant="outline" className={dailyWagesEnabled ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-slate-100 text-slate-600"}>
                    {dailyWagesEnabled ? "Enabled" : "Off by Default"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  Turn this on to manage daily-wage (₹/day) and hourly-wage (₹/hour) workers. 
                  When enabled, you will see options in <strong>Employees</strong> to add daily/hourly wagers, 
                  manually set check-in & check-out times, and calculate accurate daily/hourly wage payouts in the <strong>Salaries</strong> tab.
                </p>
              </div>
              <Switch
                id="daily-wages-toggle"
                checked={dailyWagesEnabled}
                onCheckedChange={setDailyWagesEnabled}
              />
            </div>

            <div className="flex items-start justify-between p-4 border rounded-xl bg-slate-50/70 dark:bg-slate-900/40 gap-4 mt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="individual-weekoffs-toggle" className="text-base font-semibold cursor-pointer">
                    Enable Individual Employee Week-Offs
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                  When enabled, you can assign different week-offs (like Monday or Tuesday) to individual employees for rotational shifts.
                  If disabled, the global company week-off (e.g., Sunday) will apply to everyone.
                </p>
              </div>
              <Switch
                id="individual-weekoffs-toggle"
                checked={enableIndividualWeekOffs}
                onCheckedChange={setEnableIndividualWeekOffs}
              />
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-sm">Weekly Off Days</h3>
              <p className="text-xs text-muted-foreground">Select the days that are fixed weekly off days for your organization. These days will automatically be marked as "Holiday" in the monthly overview.</p>
              
              <div className="flex flex-wrap gap-4 mt-2">
                {[
                  { label: "Sunday", value: 0 },
                  { label: "Monday", value: 1 },
                  { label: "Tuesday", value: 2 },
                  { label: "Wednesday", value: 3 },
                  { label: "Thursday", value: 4 },
                  { label: "Friday", value: 5 },
                  { label: "Saturday", value: 6 }
                ].map((day) => (
                  <label key={day.value} className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                      checked={weeklyOffs.includes(day.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWeeklyOffs([...weeklyOffs, day.value]);
                        } else {
                          setWeeklyOffs(weeklyOffs.filter((v) => v !== day.value));
                        }
                      }}
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={saveSettings} className="gap-2"><Save className="h-4 w-4" />Save Settings</Button>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ========== HR CHAT TAB ========== */}
      <TabsContent value="hr-chat">
        <Card className="overflow-hidden">
          <CardHeader className="border-b py-3 px-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Employee Messages
              <span className="text-xs font-normal text-muted-foreground ml-1">
                — Click an employee to view & reply their messages
              </span>
            </CardTitle>
          </CardHeader>
          <div className="flex h-[560px]">
            {/* Employees sidebar */}
            <div className="w-64 shrink-0 border-r overflow-y-auto bg-slate-50">
              {employees.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No employees found.</div>
              ) : (
                employees.map((emp) => {
                  const unread = unreadMap[emp.id] || 0;
                  const isSelected = chatSelectedEmp?.id === emp.id;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setChatSelectedEmp(emp)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b transition-colors hover:bg-blue-50 ${
                        isSelected ? "bg-blue-100 border-l-4 border-l-blue-500" : "border-l-4 border-transparent"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
                        <UserCircle2 className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{emp.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {(emp as any).designation || "Employee"}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Chat panel */}
            <div className="flex flex-1 flex-col">
              {!chatSelectedEmp ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 text-slate-300" />
                  <p className="text-sm">Select an employee to view their messages</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 border-b px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <UserCircle2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{chatSelectedEmp.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(chatSelectedEmp as any).designation || "Employee"}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatLoading ? (
                      <div className="text-center text-sm text-muted-foreground py-8">Loading messages…</div>
                    ) : chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 text-slate-200" />
                        <p className="text-sm">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isHR = msg.sender_id === hrEmployee?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col gap-1 ${
                              isHR ? "items-end" : "items-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                isHR
                                  ? "bg-blue-500 text-white rounded-br-sm"
                                  : "bg-slate-100 text-slate-900 rounded-bl-sm"
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                              {isHR ? "You" : msg.sender?.name} •{" "}
                              {format(new Date(msg.created_at), "hh:mm a")}
                              {isHR && (
                                <span className="ml-1">
                                  {msg.status === "read" ? " ✓✓" : " ✓"}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={sendChatMessage}
                    className="flex items-center gap-2 border-t px-4 py-3"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`Message ${chatSelectedEmp.name}…`}
                      className="flex-1"
                      disabled={chatSending}
                    />
                    <Button
                      type="submit"
                      disabled={chatSending || !chatInput.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {chatSending ? "Sending…" : "Send"}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>
        </Card>
      </TabsContent>

      </Tabs>
      {/* Employee Detail Dialog */}
      <Dialog open={!!selectedEmpDetail} onOpenChange={(v) => { if (!v) setSelectedEmpDetail(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCircle2 className="h-6 w-6 text-primary" />
              {selectedEmpDetail?.name}'s Attendance History
            </DialogTitle>
            <div className="mt-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium">From Date</label>
                <Input type="date" value={detailFrom} onChange={e => setDetailFrom(e.target.value)} className="h-8 w-40 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">To Date</label>
                <Input type="date" value={detailTo} onChange={e => setDetailTo(e.target.value)} className="h-8 w-40 text-sm" />
              </div>
            </div>
            
            {!loadingDetail && detailRecords.length > 0 && (
              <div className="mt-4 flex gap-4 text-sm font-medium">
                <span className="text-green-700">Present: {detailRecords.filter(r => r.status === 'present').length}</span>
                <span className="text-amber-700">Late: {detailRecords.filter(r => r.status === 'late').length}</span>
                <span className="text-orange-700">Half Day: {detailRecords.filter(r => r.status === 'half_day').length}</span>
                <span className="text-red-700">Absent: {detailRecords.filter(r => r.status === 'absent').length}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            {loadingDetail ? (
              <div className="text-center py-10 text-muted-foreground">Loading history...</div>
            ) : detailRecords.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No records found for the selected date range.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Location In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Location Out</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailRecords.map((r, i) => (
                    <TableRow key={i} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="font-medium">{format(parseISO(r.date), "MMM dd, yyyy")}</div>
                        <div className="text-xs text-muted-foreground">{r.dayName}</div>
                      </TableCell>
                      <TableCell>
                        {r.status === 'approved_leave' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Approved Leave</span>
                        ) : r.status !== '—' ? (
                          <div className="flex items-center gap-1.5">
                            {statusBadge(r.status, r.isAuto)}
                            {r.isAuto && <span className="text-[10px] text-muted-foreground italic">Auto</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.clockIn ? (
                          <div className="flex items-center gap-1 text-emerald-700 text-sm">
                            <Clock className="w-3 h-3" /> {format(new Date(r.clockIn), "hh:mm a")}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{renderLocation(r.locationIn)}</TableCell>
                      <TableCell>
                        {r.clockOut ? (
                          <div className="flex items-center gap-1 text-amber-700 text-sm">
                            <Clock className="w-3 h-3" /> {format(new Date(r.clockOut), "hh:mm a")}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{renderLocation(r.locationOut)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {r.clockIn && r.clockOut ? calculateHours(r.clockIn, r.clockOut) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
