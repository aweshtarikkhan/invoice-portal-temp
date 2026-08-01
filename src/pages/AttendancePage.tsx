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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { ChevronLeft, ChevronRight, Save, Send, MapPin, Clock, MessageSquare, UserCircle2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";

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
  const [holidays, setHolidays] = useState<any[]>([]);
  const [newHoliday, setNewHoliday] = useState({ name: "", date: "", type: "company" });
  const [weeklyOffs, setWeeklyOffs] = useState<number[]>(org?.weekly_offs || [0]);
  const [dailyDate, setDailyDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dailyLogs, setDailyLogs] = useState<Record<string, any>>({});
  const [loadingDaily, setLoadingDaily] = useState(false);
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
    if (org?.weekly_offs) {
      setWeeklyOffs(org.weekly_offs);
    }
  }, [org?.weekly_offs]);

  const monthStart = useMemo(() => startOfMonth(parseISO(month + "-01")), [month]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  // Helper: compute attendance status from clock-in time + shift rules
  const computeShiftStatus = (clockInTime: string, shift: any): Status => {
    if (!clockInTime) return "absent";
    const d = new Date(clockInTime);
    const clockInMins = d.getHours() * 60 + d.getMinutes();
    if (!shift) return "present"; // no shift assigned → just mark present

    const toMins = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.slice(0, 5).split(":").map(Number);
      return h * 60 + m;
    };
    const graceEnd = toMins(shift.start_time) + (shift.grace_minutes ?? 15);
    const lateEnd  = toMins(shift.late_end  || "10:30");
    const halfEnd  = toMins(shift.half_day_end || "14:00");

    if (clockInMins <= graceEnd) return "present";
    if (clockInMins <= lateEnd)  return "late";
    if (clockInMins <= halfEnd)  return "half_day";
    return "absent";
  };

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [emps, atts, leavesData, holsRes, clockins, empShiftsRes] = await Promise.all([
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
    ]);
    if (emps.error) toast({ title: "Failed to load employees", description: emps.error.message, variant: "destructive" });

    const empList: any[] = emps.data || [];
    setEmployees(empList);

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

    empList.forEach((emp) => {
      eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((d) => {
        const ds = format(d, "yyyy-MM-dd");
        const key = `${emp.id}|${ds}`;
        if (map[key]) return; // HR already set this → skip

        const isOff = orgWeeklyOffs.includes(d.getDay());
        const isHoliday = holsList.some((h: any) => h.date === ds);
        if (isOff || isHoliday) { map[key] = "holiday"; return; }

        const clk = clkMap[key];
        if (clk?.clock_in_time) {
          const shift = shiftMap[emp.id];
          map[key] = computeShiftStatus(clk.clock_in_time, shift);
          newAutoKeys.add(key);
        }
        // else → stays undefined (shown as —)
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
        const isOff = orgWeeklyOffs.includes(d.getDay());
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
    const current = att[`${empId}|${dateStr}`] || (isOff ? "holiday" : "present");
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

    // Deduct leave balances for leave-type statuses where no clock-in exists
    const leaveTypes: Record<string, string> = {
      paid_leave: "paid",
      casual: "casual",
      sick: "sick",
    };
    const deductRows = rows.filter((r) => {
      const lt = leaveTypes[r.status];
      if (!lt) return false;
      // If clock-in exists on that day, do NOT deduct
      const hasClockIn = !!clockData[`${r.employee_id}|${r.attendance_date}`];
      if (hasClockIn) return false;
      return true;
    });

    for (const r of deductRows) {
      const lt = leaveTypes[r.status];
      // Fetch current balance
      const { data: balRow } = await (supabase as any)
        .from("employee_leave_balances")
        .select("*")
        .eq("employee_id", r.employee_id)
        .eq("leave_type", lt)
        .single();

      if (balRow) {
        await (supabase as any)
          .from("employee_leave_balances")
          .update({ used: Number(balRow.used) + 1, updated_at: new Date().toISOString() })
          .eq("id", balRow.id);
      } else {
        // Create balance record on first deduction
        await (supabase as any).from("employee_leave_balances").insert({
          org_id: org.id,
          employee_id: r.employee_id,
          leave_type: lt,
          used: 1,
          accrued: 0,
        });
      }
    }

    setSaving(false);
    toast({ title: "Attendance saved", description: `${rows.length} record(s) saved.${ deductRows.length > 0 ? ` ${deductRows.length} leave balance(s) deducted.` : "" }` });
  };

  // Summaries
  const summaries = useMemo(() => {
    const orgWeeklyOffs = org?.weekly_offs || [0];
    return employees.map((emp) => {
      let p = 0, a = 0, h = 0, pl = 0, ho = 0;
      days.forEach((d) => {
        const isOff = orgWeeklyOffs.includes(d.getDay());
        const s = att[`${emp.id}|${format(d, "yyyy-MM-dd")}`] || (isOff ? "holiday" : "present");
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

  const saveWeeklyOffs = async () => {
    if (!org?.id) return;
    const { error } = await (supabase as any).from("organizations").update({ weekly_offs: weeklyOffs }).eq("id", org.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings Saved", description: "Weekly off days updated successfully." });
      setOrganization({ ...org, weekly_offs: weeklyOffs } as any);
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
    <div className="p-6 space-y-4">
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
          <TabsTrigger value="daily">Daily Clock Logs</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
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

                      // Determine display status — NEVER default blank days to present
                      let displayStatus: Status | "approved_leave" | null = null;
                      if (recordedStatus) {
                        displayStatus = recordedStatus as Status;
                      } else if (isHoliday || isOff) {
                        displayStatus = "holiday";
                      } else if (approvedLeaveType) {
                        displayStatus = "approved_leave" as any;
                      }
                      // else: no status → show blank

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => {
                    const log = dailyLogs[emp.id];
                    const hasClockIn = !!log?.clock_in_time;
                    const hasClockOut = !!log?.clock_out_time;
                    const shift = empShiftMap[emp.id];

                    // Compute shift-aware status
                    const computeStatus = (): { label: string; cls: string } => {
                      const isHolidayDay = holidays.some((h) => h.date === dailyDate);
                      if (isHolidayDay) return { label: "Holiday", cls: "bg-slate-100 text-slate-600 border" };
                      const approvedLeave = approvedLeaveMap[`${emp.id}|${dailyDate}`];
                      if (approvedLeave && !hasClockIn) return { label: "Approved Leave", cls: "bg-purple-100 text-purple-700 border-purple-300" };
                      if (!hasClockIn) return { label: "Absent", cls: "bg-red-100 text-red-700 border-red-300" };
                      if (!shift) return { label: "Present", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" };

                      // Compare clock-in time with shift rules
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
                      const lateStart = toMins(shift.late_start || shift.start_time);
                      const lateEnd = toMins(shift.late_end || "10:30");
                      const halfDayStart = toMins(shift.half_day_start || "10:30");
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
                          {emp.employee_code && (
                            <div className="text-xs text-muted-foreground">{emp.employee_code}</div>
                          )}
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

                        <TableCell>
                          {renderLocation(log?.clock_in_location)}
                        </TableCell>

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

                        <TableCell>
                          {renderLocation(log?.clock_out_location)}
                        </TableCell>

                        <TableCell className="text-right font-medium text-sm">
                          {hasClockIn && hasClockOut
                            ? calculateHours(log.clock_in_time, log.clock_out_time)
                            : "-"}
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

      <TabsContent value="settings">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Attendance Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Weekly Off Days</h3>
              <p className="text-xs text-muted-foreground">Select the days that are fixed weekly off days for your organization. These days will automatically be marked as "Holiday" in the monthly overview.</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                {[
                  { label: "Sunday", value: 0 },
                  { label: "Monday", value: 1 },
                  { label: "Tuesday", value: 2 },
                  { label: "Wednesday", value: 3 },
                  { label: "Thursday", value: 4 },
                  { label: "Friday", value: 5 },
                  { label: "Saturday", value: 6 }
                ].map((day) => (
                  <label key={day.value} className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-slate-50">
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

            <Button onClick={saveWeeklyOffs}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
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
