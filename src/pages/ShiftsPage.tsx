import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, Clock } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  working_days: number[];
  is_default: boolean;
  grace_minutes: number;
  late_start: string;
  late_end: string;
  half_day_start: string;
  half_day_end: string;
}

const emptyShift = {
  name: "",
  start_time: "09:00",
  end_time: "18:00",
  working_days: [1, 2, 3, 4, 5, 6],
  is_default: false,
  grace_minutes: 15,
  late_start: "09:15",
  late_end: "10:30",
  half_day_start: "10:30",
  half_day_end: "14:00",
};

export default function ShiftsPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [rows, setRows] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [empShifts, setEmpShifts] = useState<Record<string, string>>({}); // empId -> shiftId
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyShift);
  const [savingAssignment, setSavingAssignment] = useState<string | null>(null);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [shiftsRes, empsRes, assignRes] = await Promise.all([
      (supabase as any).from("shifts").select("*").eq("org_id", org.id).order("created_at"),
      (supabase as any).from("employees").select("id,name,designation").eq("org_id", org.id).eq("is_active", true).order("name"),
      (supabase as any).from("employee_shifts").select("*").eq("org_id", org.id),
    ]);
    if (shiftsRes.error) toast({ title: "Load failed", description: shiftsRes.error.message, variant: "destructive" });
    setRows(shiftsRes.data || []);
    setEmployees(empsRes.data || []);
    // Build empId -> shiftId map
    const map: Record<string, string> = {};
    (assignRes.data || []).forEach((a: any) => { map[a.employee_id] = a.shift_id; });
    setEmpShifts(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [org?.id]);

    // Auto-calculate late_start and half_day constraints
  useEffect(() => {
    if (form.start_time) {
      const [hours, minutes] = form.start_time.split(':').map(Number);
      const grace = Number(form.grace_minutes) || 0;
      let totalMinutes = hours * 60 + minutes + grace;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMins = totalMinutes % 60;
      const computedLateStart = `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
      
      setForm(prev => {
        let nextForm = { ...prev };
        if (nextForm.late_start !== computedLateStart) {
          nextForm.late_start = computedLateStart;
        }
        if (nextForm.late_end && nextForm.half_day_start && nextForm.half_day_start < nextForm.late_end) {
          nextForm.half_day_start = nextForm.late_end;
        }
        return nextForm;
      });
    }
  }, [form.start_time, form.grace_minutes, form.late_end, form.half_day_start]);

  const openCreate = () => { setEditId(null); setForm(emptyShift); setOpen(true); };
  const openEdit = (s: Shift) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      start_time: s.start_time?.slice(0, 5),
      end_time: s.end_time?.slice(0, 5),
      working_days: s.working_days || [],
      is_default: s.is_default,
      grace_minutes: s.grace_minutes ?? 15,
      late_start: s.late_start?.slice(0, 5) || "09:15",
      late_end: s.late_end?.slice(0, 5) || "10:30",
      half_day_start: s.half_day_start?.slice(0, 5) || "10:30",
      half_day_end: s.half_day_end?.slice(0, 5) || "14:00",
    });
    setOpen(true);
  };

  const toggleDay = (d: number) => {
    setForm((f: any) => ({
      ...f,
      working_days: f.working_days.includes(d)
        ? f.working_days.filter((x: number) => x !== d)
        : [...f.working_days, d].sort(),
    }));
  };

  const save = async () => {
    if (!org?.id || !form.name) return;
    const payload: any = {
      org_id: org.id,
      name: form.name,
      start_time: form.start_time,
      end_time: form.end_time,
      working_days: form.working_days,
      is_default: form.is_default,
      grace_minutes: Number(form.grace_minutes),
      late_start: form.late_start,
      late_end: form.late_end,
      half_day_start: form.half_day_start,
      half_day_end: form.half_day_end,
    };
    const { error } = editId
      ? await (supabase as any).from("shifts").update(payload).eq("id", editId)
      : await (supabase as any).from("shifts").insert(payload);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { setOpen(false); load(); toast({ title: "Shift saved" }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete shift? Employees assigned to this shift will be unassigned.")) return;
    const { error } = await (supabase as any).from("shifts").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const assignShift = async (empId: string, shiftId: string) => {
    if (!org?.id) return;
    setSavingAssignment(empId);
    try {
      if (!shiftId || shiftId === "none") {
        // Remove assignment
        await (supabase as any).from("employee_shifts").delete().eq("employee_id", empId);
        setEmpShifts((prev) => { const n = { ...prev }; delete n[empId]; return n; });
      } else {
        // Upsert assignment
        await (supabase as any).from("employee_shifts").upsert(
          { org_id: org.id, employee_id: empId, shift_id: shiftId, effective_from: new Date().toISOString().split("T")[0] },
          { onConflict: "employee_id" }
        );
        setEmpShifts((prev) => ({ ...prev, [empId]: shiftId }));
      }
      toast({ title: "Shift assigned" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingAssignment(null);
    }
  };

  const getShiftBadge = (shiftId: string) => {
    const s = rows.find((r) => r.id === shiftId);
    if (!s) return <span className="text-xs text-muted-foreground">—</span>;
    return <Badge variant="outline" className="text-xs font-medium">{s.name}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Shifts</h1>
          <p className="text-sm text-muted-foreground">Define work schedules with grace periods and late/half-day rules.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Shift</Button>
      </div>

      <Tabs defaultValue="shifts">
        <TabsList>
          <TabsTrigger value="shifts" className="flex items-center gap-1.5"><Clock className="h-4 w-4" />Shift Definitions</TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-1.5"><Users className="h-4 w-4" />Employee Assignments</TabsTrigger>
        </TabsList>

        {/* ── Shift Definitions ── */}
        <TabsContent value="shifts">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading…</div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No shifts yet. Create one to assign to employees.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead>Grace</TableHead>
                      <TableHead>Late Range</TableHead>
                      <TableHead>Half-Day Range</TableHead>
                      <TableHead>Working Days</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</TableCell>
                        <TableCell>{s.grace_minutes ?? 15} min</TableCell>
                        <TableCell className="text-xs">
                          {s.late_start?.slice(0, 5) || "09:15"} – {s.late_end?.slice(0, 5) || "10:30"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.half_day_start?.slice(0, 5) || "10:30"} – {s.half_day_end?.slice(0, 5) || "14:00"}
                        </TableCell>
                        <TableCell>{(s.working_days || []).map((d) => DAY_NAMES[d]).join(", ")}</TableCell>
                        <TableCell>{s.is_default ? <Badge className="bg-blue-100 text-blue-700 border-blue-300" variant="outline">Default</Badge> : "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Employee Assignments ── */}
        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assign Shifts to Employees</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No active employees found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Current Shift</TableHead>
                      <TableHead>Assign Shift</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        <TableCell className="text-muted-foreground">{emp.designation || "—"}</TableCell>
                        <TableCell>{getShiftBadge(empShifts[emp.id])}</TableCell>
                        <TableCell>
                          <Select
                            value={empShifts[emp.id] || "none"}
                            onValueChange={(v) => assignShift(emp.id, v)}
                            disabled={savingAssignment === emp.id}
                          >
                            <SelectTrigger className="w-48 h-8 text-xs">
                              <SelectValue placeholder="Select shift…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">— No shift —</SelectItem>
                              {rows.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)})</SelectItem>
                              ))}
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
        </TabsContent>
      </Tabs>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Shift" : "New Shift"}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Name */}
            <div><Label>Shift Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. General, Morning, Night" /></div>

            {/* Start / End time */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>

            {/* Grace Period */}
            <div>
              <Label>Grace Period (minutes)</Label>
              <Input type="number" min={0} max={60} value={form.grace_minutes} onChange={(e) => setForm({ ...form, grace_minutes: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">Arrivals within this window after start time are still marked Present.</p>
            </div>

            {/* Late Arrival Range */}
            <div>
              <Label>Late Arrival Range</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div><Label className="text-xs text-muted-foreground">From</Label><Input type="time" value={form.late_start} disabled className="bg-muted" /></div>
                <div><Label className="text-xs text-muted-foreground">To</Label><Input type="time" value={form.late_end} onChange={(e) => setForm({ ...form, late_end: e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clock-in within this range → marked <strong>Late</strong>.</p>
            </div>

            {/* Half-Day Range */}
            <div>
              <Label>Half-Day Range</Label>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div><Label className="text-xs text-muted-foreground">From</Label><Input type="time" value={form.half_day_start} min={form.late_end} onChange={(e) => setForm({ ...form, half_day_start: e.target.value })} /></div>
                <div><Label className="text-xs text-muted-foreground">To</Label><Input type="time" value={form.half_day_end} onChange={(e) => setForm({ ...form, half_day_end: e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Clock-in within this range → marked <strong>Half Day</strong>. After end → <strong>Absent</strong>.</p>
            </div>

            {/* Working Days */}
            <div>
              <Label>Working Days</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {DAY_NAMES.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`h-9 w-12 rounded border text-sm font-medium transition-colors ${
                      form.working_days.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Default toggle */}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_default} onCheckedChange={(c) => setForm({ ...form, is_default: c })} />
              <Label>Set as default shift for new employees</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

