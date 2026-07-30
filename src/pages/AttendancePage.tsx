import { useEffect, useMemo, useState } from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";

type Status = "present" | "absent" | "half_day" | "paid_leave" | "holiday";

const STATUS_OPTIONS: { value: Status; label: string; short: string; cls: string }[] = [
  { value: "present", label: "Present", short: "P", cls: "bg-green-100 text-green-700 border-green-300" },

  { value: "absent", label: "Absent", short: "A", cls: "bg-red-100 text-red-700 border-red-300" },
  { value: "half_day", label: "Half-day", short: "H", cls: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "paid_leave", label: "Paid Leave", short: "PL", cls: "bg-blue-100 text-blue-700 border-blue-300" },
  { value: "holiday", label: "Holiday", short: "HO", cls: "bg-muted text-muted-foreground border-border" },
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

  useEffect(() => {
    if (org?.weekly_offs) {
      setWeeklyOffs(org.weekly_offs);
    }
  }, [org?.weekly_offs]);

  const monthStart = useMemo(() => startOfMonth(parseISO(month + "-01")), [month]);
  const monthEnd = useMemo(() => endOfMonth(monthStart), [monthStart]);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [emps, atts, leavesData, hols, clockins] = await Promise.all([
      (supabase as any).from("employees").select("*").eq("org_id", org.id).eq("is_active", true).order("name"),
      (supabase as any).from("attendance").select("*").eq("org_id", org.id)
        .gte("attendance_date", format(monthStart, "yyyy-MM-dd"))
        .lte("attendance_date", format(monthEnd, "yyyy-MM-dd")),
      (supabase as any).from("leaves").select("*, employees(name)").eq("org_id", org.id).order('created_at', { ascending: false }),
      (supabase as any).from("holidays").select("*").eq("org_id", org.id).order("date", { ascending: true }),
      (supabase as any).from("attendances").select("*").eq("org_id", org.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd")),
    ]);
    if (emps.error) toast({ title: "Failed to load employees", description: emps.error.message, variant: "destructive" });
    setEmployees(emps.data || []);
    const map: Record<string, Status> = {};
    (atts.data || []).forEach((r: any) => { map[`${r.employee_id}|${r.attendance_date}`] = r.status; });
    
    const clkMap: Record<string, any> = {};
    (clockins?.data || []).forEach((r: any) => { clkMap[`${r.employee_id}|${r.date}`] = r; });
    
    setAtt(map);
    setClockData(clkMap);
    setRawAtt(atts.data || []);
    setLeaves(leavesData?.data || []);
    setHolidays(hols?.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [org?.id, month]);

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
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Attendance saved", description: `${rows.length} record(s).` });
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

  const statusBadge = (s: Status | undefined) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s) || STATUS_OPTIONS[0];
    return <span className={`inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] font-semibold ${opt.cls}`}>{opt.short}</span>;
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
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
          <TabsTrigger value="holidays">Company Holidays</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
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
                      const s = att[`${emp.id}|${ds}`] || (isOff ? "holiday" : "present");
                      const c = clockData[`${emp.id}|${ds}`];
                      return (
                        <TableCell key={ds} className="text-center p-1 relative group">
                          <button onClick={() => cycle(emp.id, ds)} title={ds}>
                            {statusBadge(s)}
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

      </Tabs>
    </div>
  );
}
