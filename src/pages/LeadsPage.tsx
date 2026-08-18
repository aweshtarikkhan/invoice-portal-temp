import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
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
import { Plus, Pencil, Trash2, ArrowRightCircle, Search, Users, TrendingUp, Target, DollarSign, Flame, Snowflake, Sun, Phone, Mail, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO } from "date-fns";

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

const emptyForm = { name: "", company: "", email: "", phone: "", source: "", status: "new", estimated_value: "0", notes: "", tags: "", priority: "warm" };

export default function LeadsPage() {
  const org = useAppStore((s) => s.organization);
  const navigate = useNavigate();
  const { toast } = useToast();
  const currency = (org as any)?.currency_code || "INR";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any).from("leads").select("*").eq("org_id", org.id).order("created_at", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [org?.id]);

  const openNew = () => { setEditId(null); setForm(emptyForm); setOpen(true); };
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
    if (!org?.id || !form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    const payload: any = {
      org_id: org.id,
      name: form.name.trim(), company: form.company || null, email: form.email || null, phone: form.phone || null,
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
    else { setOpen(false); load(); toast({ title: editId ? "Lead updated" : "Lead added" }); }
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">Capture prospects, qualify and convert them into clients or deals.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Lead</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1"><Users className="h-4 w-4" /><span className="text-xs font-medium">Total Leads</span></div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1"><TrendingUp className="h-4 w-4" /><span className="text-xs font-medium">New This Month</span></div>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1"><Target className="h-4 w-4" /><span className="text-xs font-medium">Conversion Rate</span></div>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1"><DollarSign className="h-4 w-4" /><span className="text-xs font-medium">Pipeline Value</span></div>
            <div className="text-xl font-bold">{formatCurrency(stats.pipelineValue, currency)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1"><Flame className="h-4 w-4" /><span className="text-xs font-medium">Hot Leads</span></div>
            <div className="text-2xl font-bold">{stats.hotLeads}</div>
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
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
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
    </div>
  );
}
