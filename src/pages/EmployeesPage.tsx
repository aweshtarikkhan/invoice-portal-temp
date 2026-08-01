import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, CalendarCheck, FileText, KeyRound } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { NavLink } from "@/components/NavLink";

interface Employee {
  id: string;
  org_id: string;
  name: string;
  employee_code: string | null;
  designation: string | null;
  phone: string | null;
  email: string | null;
  joining_date: string | null;
  monthly_salary: number;
  paid_leaves_per_month: number;
  is_active: boolean;
  auth_user_id: string | null;
  notes: string | null;
}

const empty = {
  name: "", employee_code: "", designation: "", phone: "", email: "",
  joining_date: "", monthly_salary: "0", paid_leaves_per_month: "2",
  is_active: true, notes: "",
  pan: "", bank_account: "", bank_ifsc: "", address: "",
  basic_percent: "50", hra_percent: "20",
  pf_applicable: false, esic_applicable: false,
};

export default function EmployeesPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [rows, setRows] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [portalEmp, setPortalEmp] = useState<any>(null);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("none");

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [empsRes, shiftsRes] = await Promise.all([
      (supabase as any).from("employees").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
      (supabase as any).from("shifts").select("*").eq("org_id", org.id).order("created_at"),
    ]);
    if (empsRes.error) toast({ title: "Failed to load", description: empsRes.error.message, variant: "destructive" });
    else setRows(empsRes.data || []);
    setShifts(shiftsRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [org?.id]);

  const openNew = () => { setEditId(null); setForm(empty); setSelectedShiftId("none"); setOpen(true); };
  const openEdit = async (e: any) => {
    setEditId(e.id);
    setForm({
      name: e.name, employee_code: e.employee_code || "", designation: e.designation || "",
      phone: e.phone || "", email: e.email || "", joining_date: e.joining_date || "",
      monthly_salary: String(e.monthly_salary), paid_leaves_per_month: String(e.paid_leaves_per_month),
      is_active: e.is_active, notes: e.notes || "",
      pan: e.pan || "", bank_account: e.bank_account || "", bank_ifsc: e.bank_ifsc || "", address: e.address || "",
      basic_percent: String(e.basic_percent ?? 50), hra_percent: String(e.hra_percent ?? 20),
      pf_applicable: !!e.pf_applicable, esic_applicable: !!e.esic_applicable,
    });
    // Fetch current shift assignment for this employee
    const { data: assignData } = await (supabase as any)
      .from("employee_shifts")
      .select("shift_id")
      .eq("employee_id", e.id)
      .single();
    setSelectedShiftId(assignData?.shift_id || "none");
    setOpen(true);
  };

  const save = async () => {
    if (!org?.id) return;
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const payload: any = {
      org_id: org.id,
      name: form.name.trim(),
      employee_code: form.employee_code || null,
      designation: form.designation || null,
      phone: form.phone || null,
      email: form.email || null,
      joining_date: form.joining_date || null,
      monthly_salary: Number(form.monthly_salary) || 0,
      paid_leaves_per_month: Number(form.paid_leaves_per_month) || 0,
      is_active: !!form.is_active,
      notes: form.notes || null,
      pan: form.pan || null,
      bank_account: form.bank_account || null,
      bank_ifsc: form.bank_ifsc || null,
      address: form.address || null,
      basic_percent: Number(form.basic_percent) || 0,
      hra_percent: Number(form.hra_percent) || 0,
      pf_applicable: !!form.pf_applicable,
      esic_applicable: !!form.esic_applicable,
    };
    const q = editId
      ? (supabase as any).from("employees").update(payload).eq("id", editId)
      : (supabase as any).from("employees").insert(payload).select().single();
    const { data: savedEmp, error } = await q;
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }

    // Handle shift assignment
    const empId = editId || savedEmp?.id;
    if (empId) {
      if (selectedShiftId && selectedShiftId !== "none") {
        await (supabase as any).from("employee_shifts").upsert(
          { org_id: org.id, employee_id: empId, shift_id: selectedShiftId, effective_from: new Date().toISOString().split("T")[0] },
          { onConflict: "employee_id" }
        );
      } else {
        // Remove shift if "No shift" selected
        await (supabase as any).from("employee_shifts").delete().eq("employee_id", empId);
      }
    }

    toast({ title: editId ? "Employee updated" : "Employee added" });
    setOpen(false); load();
  };

  const grantAccess = async () => {
    if (!portalEmp || !portalEmail || !portalPassword) return;
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          employee_id: portalEmp.id,
          email: portalEmail,
          password: portalPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create portal access");
      toast({ title: "Success", description: `Portal access granted! Employee can login with email: ${portalEmail} and the password you set.` });
      setPortalEmp(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this employee? Their attendance records will also be removed.")) return;
    const { error } = await (supabase as any).from("employees").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Deleted" }); load(); }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage your staff, grant attendance portal access.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <NavLink to="/attendance"><CalendarCheck className="h-4 w-4 mr-2" />Attendance</NavLink>
          </Button>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Employee</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Monthly Salary</TableHead>
                <TableHead className="text-right">Paid Leaves/mo</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No employees yet. Click "New Employee" to add one.</TableCell></TableRow>
              ) : rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>{e.employee_code || "—"}</TableCell>
                  <TableCell>{e.designation || "—"}</TableCell>
                  <TableCell>{e.phone || "—"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(e.monthly_salary, (org as any)?.currency || "INR")}</TableCell>
                  <TableCell className="text-right">{e.paid_leaves_per_month}</TableCell>
                  <TableCell>
                    {e.auth_user_id ? (
                      <span className="text-green-600 text-xs font-medium">✓ Active</span>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setPortalEmp(e); setPortalEmail(e.email || ""); setPortalPassword(""); }}>
                        <KeyRound className="h-3 w-3 mr-1" /> Grant Access
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>{e.is_active ? <span className="text-green-600 text-xs font-medium">Active</span> : <span className="text-muted-foreground text-xs">Inactive</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" asChild title="Documents">
                        <NavLink to={`/employees/${e.id}/documents`}><FileText className="h-4 w-4" /></NavLink>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Employee Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "New"} Employee</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Employee Code</Label><Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} /></div>
            <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Joining Date</Label><Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></div>
            <div><Label>PAN</Label><Input value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} /></div>
            <div><Label>Bank Account</Label><Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} /></div>
            <div><Label>IFSC</Label><Input value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} /></div>
            <div className="col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>

            <div className="col-span-2 mt-2 pt-2 border-t"><div className="text-sm font-medium text-muted-foreground mb-1">Salary Structure</div></div>
            <div><Label>Monthly Salary (CTC)</Label><Input type="number" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} /></div>
            <div><Label>Paid Leaves / Month</Label><Input type="number" step="0.5" value={form.paid_leaves_per_month} onChange={(e) => setForm({ ...form, paid_leaves_per_month: e.target.value })} /></div>
            <div><Label>Basic %</Label><Input type="number" value={form.basic_percent} onChange={(e) => setForm({ ...form, basic_percent: e.target.value })} /></div>
            <div><Label>HRA %</Label><Input type="number" value={form.hra_percent} onChange={(e) => setForm({ ...form, hra_percent: e.target.value })} /></div>
            <div className="flex items-center gap-2 mt-6"><Switch checked={form.pf_applicable} onCheckedChange={(v) => setForm({ ...form, pf_applicable: v })} /><Label>PF Applicable (12% of Basic)</Label></div>
            <div className="flex items-center gap-2 mt-6"><Switch checked={form.esic_applicable} onCheckedChange={(v) => setForm({ ...form, esic_applicable: v })} /><Label>ESIC Applicable (0.75% if gross ≤ ₹21k)</Label></div>
            <div className="flex items-center gap-2 mt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
            <div className="col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

            {/* Shift Assignment */}
            <div className="col-span-2 mt-2 pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-2">Shift Assignment</div>
              {shifts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No shifts defined yet. <NavLink to="/shifts" className="text-primary underline">Create a shift first.</NavLink></p>
              ) : (
                <div>
                  <Label>Assign Shift</Label>
                  <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a shift..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No shift assigned —</SelectItem>
                      {shifts.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} &nbsp;·&nbsp; {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                          {s.grace_minutes ? ` · Grace ${s.grace_minutes}m` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">This determines Late / Half Day / Absent rules for attendance.</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? "Save Changes" : "Add Employee"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Portal Access Dialog */}
      <Dialog open={!!portalEmp} onOpenChange={(v) => { if (!v) setPortalEmp(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Attendance Portal Access</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Create login credentials for <strong>{portalEmp?.name}</strong> to access the Attendance Portal.
            They can log in immediately with this email & password — no email confirmation needed.
          </p>
          <div className="space-y-3 py-2">
            <div>
              <Label>Email</Label>
              <Input type="email" value={portalEmail} onChange={(e) => setPortalEmail(e.target.value)} placeholder="employee@company.com" />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input type="text" value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortalEmp(null)}>Cancel</Button>
            <Button onClick={grantAccess} disabled={portalLoading || !portalEmail || portalPassword.length < 6}>
              {portalLoading ? "Creating..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
