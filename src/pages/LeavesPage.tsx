import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Trash2, Settings, Users, ClipboardList, Info } from "lucide-react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";

const LEAVE_TYPES = [
  { v: "casual", l: "Casual Leave", color: "bg-blue-100 text-blue-700 border-blue-300", annual: 12 },
  { v: "sick",   l: "Sick Leave",   color: "bg-amber-100 text-amber-700 border-amber-300", annual: 5 },
  { v: "paid",   l: "Paid Leave",   color: "bg-green-100 text-green-700 border-green-300", annual: 8 },
  { v: "unpaid", l: "Unpaid (LOP)", color: "bg-red-100 text-red-700 border-red-300", annual: 0 },
  { v: "other",  l: "Other",        color: "bg-slate-100 text-slate-700 border-slate-300", annual: 0 },
];

const statusBadge = (s: string) => {
  const map: any = {
    pending:  "bg-amber-100 text-amber-800 border-amber-300",
    approved: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
  };
  return <Badge variant="outline" className={map[s] || ""}>{s}</Badge>;
};

const typeMeta = (v: string) => LEAVE_TYPES.find((t) => t.v === v) || LEAVE_TYPES[4];

export default function LeavesPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();

  // Leave requests
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ employee_id: "", leave_type: "casual", start_date: "", end_date: "", reason: "" });

  // Leave policies
  const [policies, setPolicies] = useState<any[]>([]);
  const [policyForm, setPolicyForm] = useState<Record<string, { annual_limit: number; monthly_accrual: number }>>({});
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Employee balances
  const [balances, setBalances] = useState<any[]>([]);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [lv, emps, pols, bals] = await Promise.all([
      (supabase as any).from("leaves").select("*, employees(name)").eq("org_id", org.id).order("created_at", { ascending: false }),
      (supabase as any).from("employees").select("id,name").eq("org_id", org.id).eq("is_active", true).order("name"),
      (supabase as any).from("leave_policies").select("*").eq("org_id", org.id),
      (supabase as any).from("employee_leave_balances").select("*, employees(name)").eq("org_id", org.id),
    ]);
    setRows(lv.data || []);
    setEmployees(emps.data || []);
    setPolicies(pols.data || []);
    setBalances(bals.data || []);

    // Build policy form state - merge DB data with defaults
    const pf: Record<string, { annual_limit: number; monthly_accrual: number }> = {};
    ["casual", "sick", "paid"].forEach((t) => {
      const meta = LEAVE_TYPES.find((x) => x.v === t)!;
      const existing = (pols.data || []).find((p: any) => p.leave_type === t);
      pf[t] = {
        annual_limit: existing?.annual_limit ?? meta.annual,
        monthly_accrual: existing?.monthly_accrual ?? parseFloat((meta.annual / 12).toFixed(2)),
      };
    });
    setPolicyForm(pf);
    setLoading(false);
  };

  useEffect(() => { load(); }, [org?.id]);

  const submit = async () => {
    if (!org?.id || !form.employee_id || !form.start_date || !form.end_date) {
      toast({ title: "Fill all required fields", variant: "destructive" }); return;
    }
    const days = Math.max(1, differenceInCalendarDays(parseISO(form.end_date), parseISO(form.start_date)) + 1);
    const { error } = await (supabase as any).from("leaves").insert({
      org_id: org.id, employee_id: form.employee_id, leave_type: form.leave_type,
      start_date: form.start_date, end_date: form.end_date, days, reason: form.reason, status: "pending",
    });
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { setOpen(false); setForm({ employee_id: "", leave_type: "casual", start_date: "", end_date: "", reason: "" }); load(); toast({ title: "Leave request created" }); }
  };

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await (supabase as any).from("leaves").update({ status, approved_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      if (status === "approved") {
        toast({ title: "Leave Approved", description: "Balance will deduct only when HR marks this day in attendance." });
      }
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete leave?")) return;
    const { error } = await (supabase as any).from("leaves").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else load();
  };

  const savePolicies = async () => {
    if (!org?.id) return;
    setSavingPolicy(true);
    try {
      const upserts = ["casual", "sick", "paid"].map((t) => ({
        org_id: org.id,
        leave_type: t,
        annual_limit: policyForm[t]?.annual_limit ?? 0,
        monthly_accrual: policyForm[t]?.monthly_accrual ?? 0,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await (supabase as any)
        .from("leave_policies")
        .upsert(upserts, { onConflict: "org_id,leave_type" });
      if (error) throw error;
      toast({ title: "Leave policies saved!" });
      load();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSavingPolicy(false);
    }
  };

  // Group balances per employee
  const balancesByEmp = employees.map((emp) => {
    const empBals = balances.filter((b) => b.employee_id === emp.id);
    const byType: Record<string, any> = {};
    empBals.forEach((b) => { byType[b.leave_type] = b; });
    return { emp, byType };
  });

  const getBalance = (byType: Record<string, any>, type: string) => {
    const pol = policies.find((p: any) => p.leave_type === type);
    const annual = pol?.annual_limit ?? LEAVE_TYPES.find((t) => t.v === type)?.annual ?? 0;
    const used = byType[type]?.used ?? 0;
    const remaining = Math.max(0, annual - used);
    return { annual, used, remaining };
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leaves</h1>
          <p className="text-sm text-muted-foreground">
            Manage leave requests and policies. Balance deducts only when attendance is finalized.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Request</Button>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-1.5"><ClipboardList className="h-4 w-4" />Leave Requests</TabsTrigger>
          <TabsTrigger value="balances" className="flex items-center gap-1.5"><Users className="h-4 w-4" />Employee Balances</TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-1.5"><Settings className="h-4 w-4" />Leave Policies</TabsTrigger>
        </TabsList>

        {/* ── Leave Requests Tab ── */}
        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div>
              : rows.length === 0 ? <div className="p-8 text-center text-muted-foreground">No leave requests yet.</div>
              : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From</TableHead>
                    <TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {rows.map((r) => {
                      const meta = typeMeta(r.leave_type);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.employees?.name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.l}</Badge>
                          </TableCell>
                          <TableCell>{format(parseISO(r.start_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>{format(parseISO(r.end_date), "dd MMM yyyy")}</TableCell>
                          <TableCell>{r.days}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{r.reason || "—"}</TableCell>
                          <TableCell>{statusBadge(r.status)}</TableCell>
                          <TableCell className="text-right">
                            {r.status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => setStatus(r.id, "approved")} title="Approve">
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setStatus(r.id, "rejected")} title="Reject">
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Info note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Approving a leave request does <strong>not</strong> deduct balance. Balance is deducted only when HR marks the attendance day as a leave type (casual/sick/paid) in the Attendance grid and saves. If a clock-in record exists on that day, no balance is deducted.
            </span>
          </div>
        </TabsContent>

        {/* ── Employee Balances Tab ── */}
        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave Balances (This Year)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div>
              : employees.length === 0 ? <div className="p-8 text-center text-muted-foreground">No active employees.</div>
              : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">Casual (Used / Annual)</TableHead>
                    <TableHead className="text-center">Sick (Used / Annual)</TableHead>
                    <TableHead className="text-center">Paid (Used / Annual)</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {balancesByEmp.map(({ emp, byType }) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.name}</TableCell>
                        {["casual", "sick", "paid"].map((type) => {
                          const { annual, used, remaining } = getBalance(byType, type);
                          const pct = annual > 0 ? Math.min(100, (used / annual) * 100) : 0;
                          return (
                            <TableCell key={type} className="text-center">
                              <div className="text-sm font-medium">{used} / {annual}</div>
                              <div className="text-xs text-muted-foreground">{remaining} left</div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-green-500"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
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

        {/* ── Leave Policies Tab ── */}
        <TabsContent value="policies">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Set annual leave limits and monthly accrual for each leave type. These apply to all employees in your organization. Default values: Casual=12, Sick=5, Paid=8 per year.
              </span>
            </div>

            {["casual", "sick", "paid"].map((type) => {
              const meta = typeMeta(type);
              return (
                <Card key={type}>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${meta.color}`}>{meta.l}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 pt-0">
                    <div>
                      <Label>Annual Limit (days)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={policyForm[type]?.annual_limit ?? meta.annual}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], annual_limit: Number(e.target.value) },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Monthly Accrual (days/month)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        value={policyForm[type]?.monthly_accrual ?? parseFloat((meta.annual / 12).toFixed(2))}
                        onChange={(e) =>
                          setPolicyForm((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], monthly_accrual: Number(e.target.value) },
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">How many days accrue per month for this leave type.</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <Button onClick={savePolicies} disabled={savingPolicy}>
              {savingPolicy ? "Saving…" : "Save Leave Policies"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── New Request Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Employee *</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From *</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>To *</Label><Input type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
