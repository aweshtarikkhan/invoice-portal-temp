import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Phone, Mail, Users, ClipboardList, StickyNote, MessageSquare, Check, Clock, Tag, Building2, DollarSign, Calendar, Edit, UserPlus, Target, Plus, CheckCircle2, Circle, Activity
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = [
  { v: "new", l: "New", cls: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600" },
  { v: "contacted", l: "Contacted", cls: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700" },
  { v: "qualified", l: "Qualified", cls: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-700" },
  { v: "converted", l: "Converted", cls: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700" },
  { v: "lost", l: "Lost", cls: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-700" },
];

const PRIORITIES = [
  { v: "hot", l: "Hot", cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700" },
  { v: "warm", l: "Warm", cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" },
  { v: "cold", l: "Cold", cls: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700" },
];

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Users,
  email: Mail,
  task: ClipboardList,
  note: StickyNote,
  whatsapp: MessageSquare,
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const currency = (org as any)?.currency_code || "INR";

  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Activity Form
  const [activityForm, setActivityForm] = useState({
    type: "note", subject: "", notes: "", due_date: ""
  });

  // Notes edit
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState("");

  // Convert Dialog (or inline action) & Opp Dialog
  const [oppDialogOpen, setOppDialogOpen] = useState(false);
  const [oppForm, setOppForm] = useState({
    name: "", amount: "", pipeline_stage_id: "", expected_close_date: "", notes: ""
  });

  const loadData = async () => {
    if (!org?.id || !id) return;
    setLoading(true);

    const [leadRes, actsRes, stagesRes] = await Promise.all([
      (supabase as any).from("leads").select("*").eq("id", id).eq("org_id", org.id).single(),
      (supabase as any).from("activities").select("*").eq("lead_id", id).eq("org_id", org.id).order("created_at", { ascending: false }),
      (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("sort_order", { ascending: true })
    ]);

    if (leadRes.error) {
      toast({ title: "Error loading lead", description: leadRes.error.message, variant: "destructive" });
      navigate("/leads");
      return;
    }

    setLead(leadRes.data);
    setActivities(actsRes.data || []);
    setStages(stagesRes.data || []);
    setNotesTemp(leadRes.data.notes || "");
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [org?.id, id]);

  const saveActivity = async () => {
    if (!org?.id || !id) return;
    if (!activityForm.subject.trim() && activityForm.type !== "note") {
      toast({ title: "Subject required", variant: "destructive" });
      return;
    }
    const payload = {
      org_id: org.id,
      lead_id: id,
      activity_type: activityForm.type,
      subject: activityForm.subject || "Note",
      body: activityForm.notes || null,
      due_at: activityForm.due_date ? new Date(activityForm.due_date).toISOString() : null,
    };
    const { error } = await (supabase as any).from("activities").insert(payload);
    if (error) {
      toast({ title: "Failed to log activity", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Activity logged" });
      setActivityForm({ type: "note", subject: "", notes: "", due_date: "" });
      loadData();
    }
  };

  const saveNotes = async () => {
    if (!org?.id || !id) return;
    const { error } = await (supabase as any).from("leads").update({ notes: notesTemp }).eq("id", id);
    if (error) {
      toast({ title: "Failed to save notes", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notes updated" });
      setLead({ ...lead, notes: notesTemp });
      setEditingNotes(false);
    }
  };

  const convertToClient = async () => {
    if (!org?.id || !lead) return;
    if (!confirm(`Convert "${lead.name}" into a Client?`)) return;
    const { data: client, error } = await (supabase as any).from("clients").insert({
      org_id: org.id,
      display_name: lead.company || lead.name,
      company_name: lead.company || null,
      email: lead.email || null,
      phone: lead.phone || null,
      notes: `Converted from lead. Contact: ${lead.name}`,
    }).select("*").single();

    if (error) {
      toast({ title: "Convert failed", description: error.message, variant: "destructive" });
      return;
    }
    await (supabase as any).from("leads").update({ status: "converted", converted_client_id: client.id }).eq("id", lead.id);
    toast({ title: "Converted to Client", description: client.display_name });
    loadData();
  };

  const openOppDialog = () => {
    setOppForm({
      name: `${lead.name} - Deal`,
      amount: String(lead.estimated_value || 0),
      pipeline_stage_id: stages.length > 0 ? stages[0].id : "",
      expected_close_date: "",
      notes: ""
    });
    setOppDialogOpen(true);
  };

  const saveOpportunity = async () => {
    if (!org?.id || !lead) return;
    if (!oppForm.name.trim() || !oppForm.pipeline_stage_id) {
      toast({ title: "Name and Stage are required", variant: "destructive" });
      return;
    }
    const { error } = await (supabase as any).from("opportunities").insert({
      org_id: org.id,
      lead_id: lead.id,
      title: oppForm.name,
      amount: Number(oppForm.amount) || 0,
      stage_id: oppForm.pipeline_stage_id,
      expected_close_date: oppForm.expected_close_date || null,
      notes: oppForm.notes || null
    });
    
    if (error) {
      toast({ title: "Failed to create opportunity", description: error.message, variant: "destructive" });
      return;
    }
    
    // Update lead status to qualified if it was new or contacted
    if (lead.status === "new" || lead.status === "contacted") {
      await (supabase as any).from("leads").update({ status: "qualified" }).eq("id", lead.id);
    }
    
    toast({ title: "Opportunity created" });
    setOppDialogOpen(false);
    loadData();
  };

  if (loading || !lead) {
    return <div className="p-8 text-center text-muted-foreground">Loading lead details...</div>;
  }

  const statusObj = STATUSES.find((s) => s.v === lead.status) || STATUSES[0];
  const priorityObj = PRIORITIES.find((p) => p.v === (lead.priority || "warm")) || PRIORITIES[1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/leads")} title="Back to Leads">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.name}</h1>
              <Badge variant="outline" className={statusObj.cls}>{statusObj.l}</Badge>
              <Badge variant="outline" className={priorityObj.cls}>{priorityObj.l}</Badge>
            </div>
            {lead.company && <div className="text-muted-foreground flex items-center gap-1 mt-1"><Building2 className="h-4 w-4" /> {lead.company}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          {/* Quick Log Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Log Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <Label>Type</Label>
                    <Select value={activityForm.type} onValueChange={(v) => setActivityForm({ ...activityForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label>Subject</Label>
                    <Input placeholder={activityForm.type === "note" ? "Optional subject..." : "E.g. Discovery call"} value={activityForm.subject} onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea className="h-9 min-h-0" placeholder="Activity details..." value={activityForm.notes} onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })} />
                  </div>
                  <div className="md:col-span-1 space-y-3">
                    <div>
                      <Label>Due Date (Optional)</Label>
                      <Input type="date" value={activityForm.due_date} onChange={(e) => setActivityForm({ ...activityForm, due_date: e.target.value })} />
                    </div>
                    <Button className="w-full" onClick={saveActivity}>Log {activityForm.type}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <div className="pl-4">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">Activity History</h3>
            <div className="relative border-l border-muted pb-4">
              {activities.length === 0 ? (
                <div className="ml-6 text-sm text-muted-foreground italic">No activities logged yet.</div>
              ) : (
                activities.map((act) => {
                  const Icon = ACTIVITY_ICONS[act.activity_type] || Activity;
                  return (
                    <div key={act.id} className="mb-8 ml-6 relative">
                      <span className="absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-muted ring-4 ring-background">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                      </span>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm capitalize">{act.activity_type}</span>
                            <span className="text-sm text-muted-foreground">{act.subject && `- ${act.subject}`}</span>
                            {act.completed_at ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1 py-0 h-4">Done</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-1 py-0 h-4">Pending</Badge>
                            )}
                          </div>
                          {act.body && <p className="text-sm mt-1 text-muted-foreground bg-muted/30 p-2 rounded-md">{act.body}</p>}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(parseISO(act.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.status === "converted" ? (
                <div className="p-3 bg-green-500/10 text-green-600 border border-green-500/20 rounded-md text-sm text-center">
                  This lead has been converted to a client.
                  {lead.converted_client_id && (
                    <Button variant="link" className="px-0 py-0 h-auto text-green-700 dark:text-green-400 block mx-auto mt-2" onClick={() => navigate(`/clients/${lead.converted_client_id}`)}>View Client</Button>
                  )}
                </div>
              ) : (
                <>
                  <Button className="w-full" variant="outline" onClick={openOppDialog}>
                    <Target className="h-4 w-4 mr-2" /> Create Opportunity
                  </Button>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={convertToClient}>
                    <UserPlus className="h-4 w-4 mr-2" /> Convert to Client
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  {lead.email ? <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">{lead.email}</a> : <span className="text-muted-foreground">No email</span>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  {lead.phone ? <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a> : <span className="text-muted-foreground">No phone</span>}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{formatCurrency(Number(lead.estimated_value || 0), currency)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Added {format(parseISO(lead.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              {lead.source && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Source</div>
                  <Badge variant="secondary">{lead.source}</Badge>
                </div>
              )}

              {lead.tags && lead.tags.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs py-0 h-5"><Tag className="h-3 w-3 mr-1" /> {tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notes</CardTitle>
              {!editingNotes && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingNotes(true)}><Edit className="h-3 w-3" /></Button>}
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea className="min-h-[100px]" value={notesTemp} onChange={(e) => setNotesTemp(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingNotes(false); setNotesTemp(lead.notes || ""); }}>Cancel</Button>
                    <Button size="sm" onClick={saveNotes}>Save</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {lead.notes ? lead.notes : <span className="text-muted-foreground italic">No notes added.</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Opportunity Dialog */}
      <Dialog open={oppDialogOpen} onOpenChange={setOppDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Opportunity</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Deal Name *</Label>
              <Input value={oppForm.name} onChange={(e) => setOppForm({ ...oppForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input type="number" value={oppForm.amount} onChange={(e) => setOppForm({ ...oppForm, amount: e.target.value })} />
              </div>
              <div>
                <Label>Pipeline Stage *</Label>
                <Select value={oppForm.pipeline_stage_id} onValueChange={(v) => setOppForm({ ...oppForm, pipeline_stage_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.map((stg) => (
                      <SelectItem key={stg.id} value={stg.id}>{stg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Expected Close Date</Label>
              <Input type="date" value={oppForm.expected_close_date} onChange={(e) => setOppForm({ ...oppForm, expected_close_date: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={oppForm.notes} onChange={(e) => setOppForm({ ...oppForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOppDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveOpportunity}>Create Opportunity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
