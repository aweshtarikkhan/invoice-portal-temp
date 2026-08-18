import { useEffect, useState } from "react";
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
import { Plus, Check, Trash2, Phone, Mail, MessageSquare, Users, ClipboardList, StickyNote, Pencil, AlertCircle, Calendar, Clock } from "lucide-react";
import { format, parseISO, isPast, isToday, addDays, isBefore } from "date-fns";

const TYPES = [
  { v: "call", l: "Call", icon: Phone, color: "text-blue-500" },
  { v: "meeting", l: "Meeting", icon: Users, color: "text-purple-500" },
  { v: "email", l: "Email", icon: Mail, color: "text-green-500" },
  { v: "whatsapp", l: "WhatsApp", icon: MessageSquare, color: "text-emerald-500" },
  { v: "task", l: "Task", icon: ClipboardList, color: "text-amber-500" },
  { v: "note", l: "Note", icon: StickyNote, color: "text-slate-500" },
];

const empty = { activity_type: "call", subject: "", body: "", due_at: "", lead_id: "", opportunity_id: "", client_id: "" };

export default function ActivitiesPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewTab, setViewTab] = useState<string>("all");

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    const [{ data: act }, { data: ld }, { data: op }, { data: cl }] = await Promise.all([
      (supabase as any).from("activities").select("*, leads(name), opportunities(title), clients(display_name)").eq("org_id", org.id).order("due_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
      (supabase as any).from("leads").select("id,name").eq("org_id", org.id).order("name"),
      (supabase as any).from("opportunities").select("id,title").eq("org_id", org.id).order("title"),
      supabase.from("clients").select("id, display_name").eq("org_id", org.id).eq("status", "active").order("display_name"),
    ]);
    setRows(act || []); setLeads(ld || []); setOpps(op || []); setClients(cl || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [org?.id]);

  const openNew = () => { setEditId(null); setForm(empty); setOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      activity_type: r.activity_type || "call",
      subject: r.subject || "",
      body: r.body || "",
      due_at: r.due_at ? format(parseISO(r.due_at), "yyyy-MM-dd'T'HH:mm") : "",
      lead_id: r.lead_id || "",
      opportunity_id: r.opportunity_id || "",
      client_id: r.client_id || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!org?.id || !form.subject.trim()) { toast({ title: "Subject required", variant: "destructive" }); return; }
    const payload: any = {
      org_id: org.id,
      activity_type: form.activity_type,
      subject: form.subject.trim(), body: form.body || null,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      lead_id: form.lead_id || null,
      opportunity_id: form.opportunity_id || null,
      client_id: form.client_id || null,
    };
    const q = editId
      ? (supabase as any).from("activities").update(payload).eq("id", editId)
      : (supabase as any).from("activities").insert(payload);
    const { error } = await q;
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else { setOpen(false); setForm(empty); setEditId(null); load(); toast({ title: editId ? "Activity updated" : "Activity logged" }); }
  };

  const complete = async (id: string) => {
    await (supabase as any).from("activities").update({ completed_at: new Date().toISOString() }).eq("id", id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete activity?")) return;
    await (supabase as any).from("activities").delete().eq("id", id);
    load();
  };

  const isOverdue = (r: any) => r.due_at && !r.completed_at && isPast(parseISO(r.due_at));
  const isUpcoming = (r: any) => r.due_at && !r.completed_at && !isPast(parseISO(r.due_at)) && isBefore(parseISO(r.due_at), addDays(new Date(), 7));
  const isDueToday = (r: any) => r.due_at && !r.completed_at && isToday(parseISO(r.due_at));

  const filtered = rows.filter((r) => {
    if (typeFilter !== "all" && r.activity_type !== typeFilter) return false;
    if (viewTab === "today") return isDueToday(r);
    if (viewTab === "upcoming") return isUpcoming(r);
    if (viewTab === "overdue") return isOverdue(r);
    if (viewTab === "completed") return !!r.completed_at;
    return true;
  });

  const overdueCount = rows.filter(isOverdue).length;
  const todayCount = rows.filter(isDueToday).length;
  const upcomingCount = rows.filter(isUpcoming).length;

  const typeIcon = (t: string) => {
    const T = TYPES.find((x) => x.v === t) || TYPES[0];
    const Icon = T.icon;
    return <Icon className={`h-4 w-4 ${T.color}`} />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Activities</h1>
          <p className="text-sm text-muted-foreground">Calls, meetings, notes and tasks across leads, opportunities and clients.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Log Activity</Button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={viewTab} onValueChange={setViewTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today" className="gap-1">
              Today {todayCount > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{todayCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-1">
              Upcoming {upcomingCount > 0 && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{upcomingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1">
              Overdue {overdueCount > 0 && <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{overdueCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="p-8 text-center text-muted-foreground">Loading…</div>
          : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">No activities found.</div>
          : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Type</TableHead><TableHead>Subject</TableHead><TableHead>Linked To</TableHead>
                <TableHead>Due</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const overdue = isOverdue(r);
                  return (
                    <TableRow key={r.id} className={overdue ? "bg-red-500/5" : ""}>
                      <TableCell><div className="flex items-center gap-2">{typeIcon(r.activity_type)}<span className="capitalize text-sm">{r.activity_type}</span></div></TableCell>
                      <TableCell className="font-medium">
                        {r.subject}
                        {r.body && <div className="text-xs text-muted-foreground truncate max-w-[280px]">{r.body}</div>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.leads?.name && <div>Lead: {r.leads.name}</div>}
                        {r.opportunities?.title && <div>Opp: {r.opportunities.title}</div>}
                        {r.clients?.display_name && <div>Client: {r.clients.display_name}</div>}
                        {!r.leads && !r.opportunities && !r.clients && <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.due_at ? (
                          <div className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                            {overdue && <AlertCircle className="h-3.5 w-3.5" />}
                            {!overdue && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                            {format(parseISO(r.due_at), "dd MMM yyyy, HH:mm")}
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {r.completed_at
                          ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700">Done</Badge>
                          : overdue
                            ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700">Overdue</Badge>
                            : <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700">Open</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {!r.completed_at && <Button variant="ghost" size="icon" onClick={() => complete(r.id)} title="Mark done"><Check className="h-4 w-4 text-green-600" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(empty); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Log"} Activity</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due Date/Time</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
            <div className="col-span-2"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div>
              <Label>Linked Lead</Label>
              <Select value={form.lead_id || "none"} onValueChange={(v) => setForm({ ...form, lead_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Linked Opportunity</Label>
              <Select value={form.opportunity_id || "none"} onValueChange={(v) => setForm({ ...form, opportunity_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{opps.map((o) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Linked Client</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => setForm({ ...form, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">—</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Notes</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? "Save" : "Log Activity"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
