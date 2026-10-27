import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Phone, Mail, Users, ClipboardList, StickyNote, MessageSquare, Check, Clock, Tag, Building2, IndianRupee, Calendar, Edit, UserPlus, Target, Plus, CheckCircle2, Circle, Activity
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { LeadActivityModal } from "@/components/crm/LeadActivityModal";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = (org as any)?.currency_code || "INR";

  const [lead, setLead] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [crmTeam, setCrmTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Action Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);

  // Notes edit
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState("");

  const loadData = async () => {
    if (!org?.id || !id) return;
    setLoading(true);

    const [leadRes, actsRes, stagesRes, crmTeamRes] = await Promise.all([
      (supabase as any).from("leads").select("*").eq("id", id).eq("org_id", org.id).single(),
      (supabase as any).from("activities").select("*").eq("lead_id", id).eq("org_id", org.id).order("created_at", { ascending: false }),
      (supabase as any).from("pipeline_stages").select("*").eq("org_id", org.id).order("sort_order", { ascending: true }),
      (supabase as any).from("crm_team").select("*").eq("org_id", org.id).eq("is_active", true).order("name")
    ]);

    if (leadRes.error) {
      toast({ title: "Error loading lead", description: leadRes.error.message, variant: "destructive" });
      navigate("/leads");
      return;
    }

    setLead(leadRes.data);
    setActivities(actsRes.data || []);
    setStages(stagesRes.data || []);
    setCrmTeam(crmTeamRes.data || []);
    setNotesTemp(leadRes.data.notes || "");
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [org?.id, id]);

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

  const updateAssignedOwner = async (ownerId: string | null) => {
    if (!org?.id || !id) return;
    const { error } = await (supabase as any).from("leads").update({ owner_id: ownerId }).eq("id", id);
    if (error) {
      toast({ title: "Failed to update assignment", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment updated" });
      setLead({ ...lead, owner_id: ownerId });
    }
  };

  const convertToClient = async () => {
    if (!org?.id || !lead) return;
    if (!confirm(`Convert "${lead.name}" into a Client?`)) return;
    const { data: client, error } = await (supabase as any).from("clients").insert({
      org_id: org.id,
      display_name: lead.name,
      first_name: lead.name,
      company_name: lead.company || null,
      email: lead.email || null,
      phone: lead.phone || null,
      mobile: lead.phone || null,
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

        {/* Top Header Actions */}
        <div className="flex items-center gap-2">
          {lead.status === "converted" ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300">
                Converted to Client
              </Badge>
              {lead.converted_client_id && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${lead.converted_client_id}`)}>
                  View Client
                </Button>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950 dark:text-green-400"
              onClick={convertToClient}
            >
              <UserPlus className="h-4 w-4 mr-2" /> Convert to Client
            </Button>
          )}

          <Button className="bg-primary text-white" onClick={() => setActionModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Action
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - 2/3: Activity History */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Activity History
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => setActionModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> Add Action
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-muted pl-6 ml-2 py-2">
                {activities.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-4">No activities logged yet. Click &quot;Add Action&quot; to log a task or call.</div>
                ) : (
                  activities.map((act) => {
                    const Icon = ACTIVITY_ICONS[act.activity_type] || Activity;
                    return (
                      <div key={act.id} className="mb-6 last:mb-0 relative">
                        <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full bg-background border border-muted ring-4 ring-background">
                          <Icon className="h-3 w-3 text-muted-foreground" />
                        </span>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm capitalize">{act.activity_type}</span>
                              <span className="text-sm text-foreground">{act.subject && `- ${act.subject}`}</span>
                              {act.completed_at ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1 py-0 h-4">Done</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] px-1 py-0 h-4">Pending</Badge>
                              )}
                            </div>
                            {act.body && <p className="text-sm mt-1.5 text-muted-foreground bg-muted/30 p-2.5 rounded-md whitespace-pre-wrap">{act.body}</p>}
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
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    {lead.email ? <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">{lead.email}</a> : <span className="text-muted-foreground">No email</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    {lead.phone ? <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a> : <span className="text-muted-foreground">No phone</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatCurrency(Number(lead.estimated_value || 0), currency)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>Added {format(parseISO(lead.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Assigned To (Sales Team)</div>
                <Select value={lead.owner_id || "unassigned"} onValueChange={(v) => updateAssignedOwner(v === "unassigned" ? null : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {crmTeam.map((member) => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

      {/* Activity / Action Modal */}
      <LeadActivityModal
        open={actionModalOpen}
        onOpenChange={setActionModalOpen}
        lead={lead}
        onSaved={loadData}
      />
    </div>
  );
}
