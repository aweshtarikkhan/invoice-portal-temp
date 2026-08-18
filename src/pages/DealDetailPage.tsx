import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Building2, DollarSign, Calendar, Target, TrendingUp, FileText, Check, X, Phone, Mail, Users, ClipboardList, StickyNote, MessageSquare, Clock, Plus, Edit, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO, formatDistanceToNow } from "date-fns";

const ACTIVITY_TYPES = [
  { v: "call", l: "Call", icon: Phone },
  { v: "meeting", l: "Meeting", icon: Users },
  { v: "email", l: "Email", icon: Mail },
  { v: "task", l: "Task", icon: ClipboardList },
  { v: "note", l: "Note", icon: StickyNote },
];

export default function DealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const currency = (org as any)?.currency || "INR";

  const [deal, setDeal] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  
  const [actType, setActType] = useState("note");
  const [actSubject, setActSubject] = useState("");
  const [actBody, setActBody] = useState("");
  const [savingAct, setSavingAct] = useState(false);

  const loadData = async () => {
    if (!id || !org?.id) return;
    setLoading(true);
    
    const [
      { data: op },
      { data: st },
      { data: cl },
      { data: acts }
    ] = await Promise.all([
      (supabase as any).from("opportunities").select("*, clients(id, display_name)").eq("id", id).eq("org_id", org.id).single(),
      (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("sort_order"),
      (supabase as any).from("clients").select("id, display_name").eq("org_id", org.id).order("display_name"),
      (supabase as any).from("activities").select("*").eq("opportunity_id", id).eq("org_id", org.id).order("created_at", { ascending: false })
    ]);
    
    if (op) {
      setDeal(op);
      setNotes(op.notes || "");
    }
    setStages(st || []);
    setClients(cl || []);
    setActivities(acts || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id, org?.id]);

  const handleUpdateNotes = async () => {
    if (!deal) return;
    setSavingNotes(true);
    const { error } = await (supabase as any).from("opportunities").update({ notes }).eq("id", deal.id);
    setSavingNotes(false);
    if (error) toast({ title: "Failed to update notes", variant: "destructive" });
    else toast({ title: "Notes updated" });
  };

  const handleLogActivity = async () => {
    if (!actSubject.trim() || !org?.id || !deal) return;
    setSavingAct(true);
    const payload = {
      org_id: org.id,
      opportunity_id: deal.id,
      activity_type: actType,
      subject: actSubject.trim(),
      body: actBody.trim() || null,
    };
    const { error } = await (supabase as any).from("activities").insert(payload);
    setSavingAct(false);
    if (error) {
      toast({ title: "Failed to log activity", variant: "destructive" });
    } else {
      toast({ title: "Activity logged" });
      setActSubject("");
      setActBody("");
      loadData();
    }
  };

  const handleUpdateStage = async (stageId: string) => {
    if (!deal || deal.stage_id === stageId) return;
    if (!confirm("Move deal to this stage?")) return;
    const stage = stages.find((s) => s.id === stageId);
    
    const patch: any = { stage_id: stageId };
    if (stage) patch.probability = stage.win_probability;
    
    const { error } = await (supabase as any).from("opportunities").update(patch).eq("id", deal.id);
    if (error) {
      toast({ title: "Move failed", variant: "destructive" });
    } else {
      toast({ title: "Stage updated" });
      loadData();
    }
  };

  const handleMarkWonLost = async (won: boolean) => {
    if (!deal) return;
    const targetStage = stages.find((s) => won ? s.is_won : s.is_lost);
    if (targetStage) {
      handleUpdateStage(targetStage.id);
    } else {
      toast({ title: `No default ${won ? "won" : "lost"} stage configured.`, variant: "destructive" });
    }
  };

  const openEdit = () => {
    if (!deal) return;
    setEditForm({
      title: deal.title || "",
      stage_id: deal.stage_id || "",
      client_id: deal.client_id || "",
      amount: String(deal.amount || 0),
      probability: String(deal.probability || 0),
      expected_close_date: deal.expected_close_date || "",
      notes: deal.notes || ""
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!deal) return;
    const payload = {
      title: editForm.title.trim(),
      stage_id: editForm.stage_id,
      client_id: editForm.client_id || null,
      amount: Number(editForm.amount) || 0,
      probability: Number(editForm.probability) || 0,
      expected_close_date: editForm.expected_close_date || null,
      notes: editForm.notes
    };
    const { error } = await (supabase as any).from("opportunities").update(payload).eq("id", deal.id);
    if (error) {
      toast({ title: "Save failed", variant: "destructive" });
    } else {
      setEditOpen(false);
      loadData();
      toast({ title: "Deal updated" });
    }
  };

  const handleCreateInvoice = () => {
    if (!deal) return;
    navigate(`/invoices?new=1&client_id=${deal.client_id || ""}&prefill_amount=${deal.amount || ""}&prefill_notes=${encodeURIComponent("Deal: " + (deal.title || ""))}`);
  };

  if (loading || !deal) {
    return <div className="p-12 text-center text-muted-foreground">Loading deal details...</div>;
  }

  const currentStage = stages.find(s => s.id === deal.stage_id);
  const currentStageIndex = stages.findIndex(s => s.id === deal.stage_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Button variant="ghost" className="mb-2 -ml-3 text-muted-foreground" onClick={() => navigate("/pipeline")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            {currentStage && (
              <Badge style={{ backgroundColor: currentStage.color || "#64748b" }} className="text-white hover:opacity-90">
                {currentStage.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-muted-foreground">
            <div className="flex items-center text-lg font-semibold text-foreground">
              <DollarSign className="h-5 w-5 mr-1" />
              {formatCurrency(Number(deal.amount || 0), currency)}
            </div>
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-1.5" />
              {deal.probability || 0}% Win Probability
            </div>
            {deal.expected_close_date && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5" />
                Close: {format(parseISO(deal.expected_close_date), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </div>
        <div>
          <Button variant="outline" onClick={openEdit}>
            <Edit className="h-4 w-4 mr-2" /> Edit Deal
          </Button>
        </div>
      </div>

      {/* Stage Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0 rounded-full"></div>
            {stages.map((stg, idx) => {
              const isPast = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const color = stg.color || "#64748b";
              
              return (
                <div key={stg.id} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => handleUpdateStage(stg.id)}>
                  <div 
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isPast ? 'bg-background' : 'bg-muted border-transparent'}`}
                    style={{ borderColor: isPast ? color : undefined }}
                  >
                    {isPast && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>}
                  </div>
                  <div className={`mt-2 text-xs font-medium transition-colors ${isCurrent ? 'text-foreground' : 'text-muted-foreground'} group-hover:text-foreground`}>
                    {stg.name}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Quick Note / Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={actType} onValueChange={setActType}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => (
                      <SelectItem key={t.v} value={t.v}>
                        <div className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" /> {t.l}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Subject..." value={actSubject} onChange={e => setActSubject(e.target.value)} className="flex-1" />
              </div>
              <Textarea placeholder="Activity details..." value={actBody} onChange={e => setActBody(e.target.value)} rows={3} />
              <div className="flex justify-end">
                <Button onClick={handleLogActivity} disabled={savingAct}>
                  <Plus className="h-4 w-4 mr-2" /> Log Activity
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Activity Timeline</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center text-muted-foreground py-6">No activities logged yet.</div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {activities.map(act => {
                    const T = ACTIVITY_TYPES.find(t => t.v === act.activity_type) || ACTIVITY_TYPES[0];
                    const Icon = T.icon;
                    return (
                      <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border bg-background text-muted-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm">{act.subject}</h4>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}</span>
                          </div>
                          {act.body && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{act.body}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                rows={6}
                placeholder="Internal notes about this deal..."
              />
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleUpdateNotes} disabled={savingNotes}>
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Deal Info</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {deal.clients && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Client</div>
                    <div className="text-sm font-medium hover:underline cursor-pointer" onClick={() => navigate(`/clients/${deal.client_id}`)}>
                      {deal.clients.display_name}
                    </div>
                  </div>
                </div>
              )}
              {deal.lead_id && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Lead</div>
                    <div className="text-sm font-medium hover:underline cursor-pointer" onClick={() => navigate(`/leads/${deal.lead_id}`)}>
                      View Lead
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <TrendingUp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Stage</div>
                  <div className="text-sm font-medium">{currentStage?.name || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="text-sm font-medium">{format(new Date(deal.created_at), "MMM d, yyyy")}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {currentStage?.is_won && (
                <Button className="w-full justify-start" onClick={handleCreateInvoice}>
                  <FileText className="h-4 w-4 mr-2" /> Create Invoice
                </Button>
              )}
              {!currentStage?.is_won && (
                <Button variant="outline" className="w-full justify-start text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => handleMarkWonLost(true)}>
                  <Check className="h-4 w-4 mr-2" /> Mark as Won
                </Button>
              )}
              {!currentStage?.is_lost && (
                <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => handleMarkWonLost(false)}>
                  <X className="h-4 w-4 mr-2" /> Mark as Lost
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit Opportunity</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={editForm.stage_id} onValueChange={v => setEditForm({ ...editForm, stage_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client</Label>
              <Select value={editForm.client_id || "none"} onValueChange={v => setEditForm({ ...editForm, client_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.display_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
            </div>
            <div>
              <Label>Probability %</Label>
              <Input type="number" value={editForm.probability} onChange={e => setEditForm({ ...editForm, probability: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Expected Close Date</Label>
              <Input type="date" value={editForm.expected_close_date} onChange={e => setEditForm({ ...editForm, expected_close_date: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
