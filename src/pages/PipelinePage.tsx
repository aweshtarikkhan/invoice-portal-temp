import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  SlidersHorizontal,
  ArrowRightLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { triggerDealWonAutomations } from "@/lib/crm-automations";

const emptyOpp = {
  title: "",
  stage_id: "",
  lead_id: "",
  amount: "0",
  expected_close_date: "",
  probability: "0",
  notes: "",
};

// Stage styling themes matching the modern CRM pipeline design
const getStageTheme = (stage: any, index: number) => {
  const name = (stage.name || "").toLowerCase();

  if (name.includes("lost") || stage.is_lost) {
    return {
      headerBg: "bg-[#fecdd3] text-rose-950",
      columnBg: "bg-[#fff1f2]/70 border-rose-100",
      dotColor: "#f43f5e",
      isLost: true,
    };
  }
  if (name.includes("won") || stage.is_won) {
    return {
      headerBg: "bg-[#bbf7d0] text-emerald-950",
      columnBg: "bg-[#f0fdf4]/80 border-emerald-100",
      dotColor: "#10b981",
      isWon: true,
    };
  }
  if (name.includes("negot")) {
    return {
      headerBg: "bg-[#fed7aa] text-amber-950",
      columnBg: "bg-[#fff7ed]/80 border-amber-100",
      dotColor: "#f59e0b",
      isNegotiation: true,
    };
  }
  if (name.includes("propos")) {
    return {
      headerBg: "bg-[#ddd6fe] text-purple-950",
      columnBg: "bg-[#f5f3ff]/80 border-purple-100",
      dotColor: "#8b5cf6",
      isProposal: true,
    };
  }
  if (name.includes("qualif")) {
    return {
      headerBg: "bg-[#bfdbfe] text-blue-950",
      columnBg: "bg-[#eff6ff]/80 border-blue-100",
      dotColor: "#3b82f6",
      isQualification: true,
    };
  }
  if (name.includes("prospect")) {
    return {
      headerBg: "bg-[#cbd5e1] text-slate-900",
      columnBg: "bg-[#f1f5f9]/80 border-slate-200",
      dotColor: "#64748b",
      isProspecting: true,
    };
  }

  // Fallback themes for custom stages
  const fallbacks = [
    { headerBg: "bg-[#cbd5e1] text-slate-900", columnBg: "bg-[#f1f5f9]/80 border-slate-200", dotColor: "#64748b" },
    { headerBg: "bg-[#bfdbfe] text-blue-950", columnBg: "bg-[#eff6ff]/80 border-blue-100", dotColor: "#3b82f6" },
    { headerBg: "bg-[#ddd6fe] text-purple-950", columnBg: "bg-[#f5f3ff]/80 border-purple-100", dotColor: "#8b5cf6" },
    { headerBg: "bg-[#fed7aa] text-amber-950", columnBg: "bg-[#fff7ed]/80 border-amber-100", dotColor: "#f59e0b" },
    { headerBg: "bg-[#bbf7d0] text-emerald-950", columnBg: "bg-[#f0fdf4]/80 border-emerald-100", dotColor: "#10b981" },
    { headerBg: "bg-[#fecdd3] text-rose-950", columnBg: "bg-[#fff1f2]/70 border-rose-100", dotColor: "#f43f5e" },
  ];
  return fallbacks[index % fallbacks.length];
};

export default function PipelinePage() {
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { toast } = useToast();
  const currency = (org as any)?.currency || "INR";
  const [stages, setStages] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyOpp);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!org?.id) return;
    setLoading(true);
    let { data: st } = await (supabase as any)
      .from("pipeline_stages")
      .select("*")
      .eq("org_id", org.id)
      .order("sort_order");

    if (!st || st.length === 0) {
      await (supabase as any).rpc("seed_default_pipeline", { p_org_id: org.id });
      ({ data: st } = await (supabase as any)
        .from("pipeline_stages")
        .select("*")
        .eq("org_id", org.id)
        .order("sort_order"));
    }

    const [{ data: op }, { data: ld }] = await Promise.all([
      (supabase as any)
        .from("opportunities")
        .select("*, leads(name, company)")
        .eq("org_id", org.id)
        .order("sort_order"),
      (supabase as any)
        .from("leads")
        .select("id, name, company, email, phone")
        .eq("org_id", org.id)
        .order("name"),
    ]);

    setStages(st || []);
    setOpps(op || []);
    setLeads(ld || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [org?.id]);

  const oppsByStage = useMemo(() => {
    const m: Record<string, any[]> = {};
    stages.forEach((s) => {
      m[s.id] = [];
    });
    opps.forEach((o) => {
      if (o.stage_id && m[o.stage_id]) m[o.stage_id].push(o);
    });
    return m;
  }, [stages, opps]);

  const openNew = (stageId?: string) => {
    setEditId(null);
    setForm({ ...emptyOpp, stage_id: stageId || stages[0]?.id || "" });
    setOpen(true);
  };

  const openEdit = (o: any) => {
    setEditId(o.id);
    setForm({
      title: o.title,
      stage_id: o.stage_id || "",
      lead_id: o.lead_id || "",
      amount: String(o.amount || 0),
      expected_close_date: o.expected_close_date || "",
      probability: String(o.probability || 0),
      notes: o.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!org?.id || !form.title.trim() || !form.stage_id) {
      toast({ title: "Title and stage required", variant: "destructive" });
      return;
    }
    const stage = stages.find((s) => s.id === form.stage_id);
    const payload: any = {
      org_id: org.id,
      title: form.title.trim(),
      stage_id: form.stage_id,
      lead_id: form.lead_id || null,
      amount: Number(form.amount) || 0,
      currency,
      expected_close_date: form.expected_close_date || null,
      probability: Number(form.probability) || stage?.win_probability || 0,
      notes: form.notes || null,
    };
    const q = editId
      ? (supabase as any).from("opportunities").update(payload).eq("id", editId)
      : (supabase as any).from("opportunities").insert(payload);
    const { data: savedData, error } = await q.select();
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setOpen(false);
      load();
      toast({ title: editId ? "Opportunity updated" : "Opportunity added" });
      if (org && user) {
        await logAudit({
          orgId: org.id,
          userId: user.id,
          entityType: "opportunity",
          entityId: editId || undefined,
          action: editId ? "update" : "create",
          description: `Opportunity ${payload.title} ${editId ? "updated" : "added"}`,
        });
      }
      if (stage?.is_won && org) {
        const savedOpp = savedData?.[0] || { id: editId, ...payload };
        triggerDealWonAutomations({ org, deal: savedOpp, stage });
      }
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete opportunity?")) return;
    await (supabase as any).from("opportunities").delete().eq("id", id);
    load();
  };

  const moveTo = async (oppId: string, stageId: string) => {
    const opp = opps.find((o) => o.id === oppId);
    if (!opp || opp.stage_id === stageId) return;
    const stage = stages.find((s) => s.id === stageId);
    const patch: any = { stage_id: stageId };
    if (stage) patch.probability = stage.win_probability;
    setOpps((prev) => prev.map((o) => (o.id === oppId ? { ...o, ...patch } : o)));
    const { error } = await (supabase as any).from("opportunities").update(patch).eq("id", oppId);
    if (error) {
      toast({ title: "Move failed", description: error.message, variant: "destructive" });
      load();
    } else {
      if (org && user) {
        await logAudit({
          orgId: org.id,
          userId: user.id,
          entityType: "opportunity",
          entityId: oppId,
          action: "update",
          description: `Opportunity moved to stage ${stage?.name || stageId}`,
        });
      }
      if (stage?.is_won && org) {
        triggerDealWonAutomations({ org, deal: { ...opp, ...patch }, stage });
      }
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -290, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 290, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Section */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag opportunities across stages. Weighted value each stage's win probability.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setStagesOpen(true)}
            className="h-9 text-xs font-semibold px-3.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-slate-500" />
            Stages
          </Button>
          <Button
            onClick={() => openNew()}
            className="h-9 text-xs font-semibold px-4 bg-[#f97316] hover:bg-[#ea580c] text-white shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Opportunity
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 font-medium text-sm">
          Loading pipeline…
        </div>
      ) : (
        /* Board Area with Floating Arrows and Horizontal Scroll */
        <div className="relative group/board">
          {/* Floating Left Arrow */}
          <button
            type="button"
            onClick={scrollLeft}
            aria-label="Scroll pipeline left"
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Floating Right Arrow */}
          <button
            type="button"
            onClick={scrollRight}
            aria-label="Scroll pipeline right"
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Centered Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <span className="text-slate-400 font-medium text-sm tracking-wide select-none">
              Drag & Drop
            </span>
          </div>

          {/* Columns Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto pb-4 pt-1 px-1 relative z-10 scroll-smooth"
          >
            <div className="flex gap-3.5 min-w-max">
              {stages.map((stg, index) => {
                const list = oppsByStage[stg.id] || [];
                const stageSum = list.reduce((s, o) => s + Number(o.amount || 0), 0);
                const theme = getStageTheme(stg, index);
                const isOver = dragOverStageId === stg.id;

                return (
                  <div
                    key={stg.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverStageId(stg.id);
                    }}
                    onDragLeave={() => setDragOverStageId(null)}
                    onDrop={() => {
                      if (draggingId) moveTo(draggingId, stg.id);
                      setDraggingId(null);
                      setDragOverStageId(null);
                    }}
                    className={`w-[260px] min-w-[260px] max-w-[260px] rounded-2xl p-2.5 flex flex-col min-h-[580px] max-h-[calc(100vh-220px)] border transition-all duration-200 ${
                      theme.columnBg
                    } ${
                      isOver
                        ? "ring-2 ring-indigo-400/50 border-indigo-400/70 shadow-md scale-[1.01]"
                        : "shadow-2xs"
                    }`}
                  >
                    {/* Stage Header Pill */}
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs tracking-tight shadow-2xs mb-2.5 ${theme.headerBg}`}
                    >
                      <span className="truncate">{stg.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="p-0.5 hover:bg-black/10 rounded-md transition-colors cursor-pointer text-inherit"
                            aria-label={`Options for ${stg.name}`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem onClick={() => openNew(stg.id)}>
                            <Plus className="w-3.5 h-3.5 mr-2" /> Add Opportunity
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStagesOpen(true)}>
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-2" /> Manage Stages
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Column Content: List of Cards or Empty State */}
                    <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
                      {list.length > 0 ? (
                        list.map((o) => (
                          <div
                            key={o.id}
                            draggable
                            onDragStart={() => setDraggingId(o.id)}
                            onDragEnd={() => setDraggingId(null)}
                            className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative select-none"
                            onDoubleClick={() => openEdit(o)}
                          >
                            {/* Card Top Row: Grip, Title, 3-Dots Menu */}
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0 group-hover:text-slate-500 transition-colors" />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="font-semibold text-xs text-slate-900 truncate leading-snug"
                                    title={o.title}
                                  >
                                    {o.title}
                                  </p>
                                  {o.leads?.name && (
                                    <p
                                      className="text-[11px] text-slate-500 truncate mt-0.5"
                                      title={`${o.leads.name}${o.leads.company ? ` • ${o.leads.company}` : ""}`}
                                    >
                                      {o.leads.name}
                                      {o.leads.company ? ` • ${o.leads.company}` : ""}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
                                    aria-label="Opportunity options"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs">
                                  <DropdownMenuItem onClick={() => openEdit(o)}>
                                    <Pencil className="w-3.5 h-3.5 mr-2 text-slate-500" /> Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>
                                      <ArrowRightLeft className="w-3.5 h-3.5 mr-2 text-slate-500" /> Move to Stage
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent className="text-xs">
                                      {stages.map((st) => (
                                        <DropdownMenuItem
                                          key={st.id}
                                          disabled={st.id === o.stage_id}
                                          onClick={() => moveTo(o.id, st.id)}
                                        >
                                          {st.name}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => remove(o.id)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Card Bottom Row: Amount & Probability */}
                            <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100">
                              <span className="text-xs font-bold text-slate-900 font-sans">
                                {formatCurrency(Number(o.amount || 0), currency)}
                              </span>
                              {o.probability != null && Number(o.probability) > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 text-slate-500 border-slate-200 bg-slate-50 font-normal"
                                >
                                  {o.probability}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : theme.isLost ? (
                        /* Empty State for Closed Lost: Dashed Drop Zone */
                        <div className="border-2 border-dashed border-rose-200/90 rounded-xl min-h-[140px] flex items-center justify-center p-4 text-center">
                          <span className="text-[11px] text-rose-400 font-medium select-none">
                            Drop lost deals here
                          </span>
                        </div>
                      ) : (
                        /* Empty State for Other Stages: White Card with ₹0.00 */
                        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            {formatCurrency(0, currency)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-0.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                                aria-label={`Options for empty ${stg.name}`}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 text-xs">
                              <DropdownMenuItem onClick={() => openNew(stg.id)}>
                                <Plus className="w-3.5 h-3.5 mr-2" /> Add Opportunity
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New / Edit Opportunity */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit" : "New"} Opportunity</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Acme Corp - ERP System"
              />
            </div>
            <div>
              <Label>Stage *</Label>
              <Select
                value={form.stage_id}
                onValueChange={(v) => setForm({ ...form, stage_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lead</Label>
              <Select
                value={form.lead_id || "none"}
                onValueChange={(v) => {
                  const leadId = v === "none" ? "" : v;
                  const selLead = leads.find((l) => l.id === leadId);
                  setForm((prev: any) => ({
                    ...prev,
                    lead_id: leadId,
                    title: prev.title?.trim()
                      ? prev.title
                      : selLead
                      ? `${selLead.name} - Opportunity`
                      : prev.title,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Select Lead —</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name} {l.company ? `(${l.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Probability %</Label>
              <Input
                type="number"
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Expected Close Date</Label>
              <Input
                type="date"
                value={form.expected_close_date}
                onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Key meeting notes, requirements, or next steps..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              className="bg-[#f97316] hover:bg-[#ea580c] text-white"
            >
              {editId ? "Save" : "Add Opportunity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pipeline Stages Management */}
      <StagesDialog
        open={stagesOpen}
        onOpenChange={setStagesOpen}
        stages={stages}
        onChanged={load}
      />
    </div>
  );
}

function StagesDialog({ open, onOpenChange, stages, onChanged }: any) {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [local, setLocal] = useState<any[]>([]);

  useEffect(() => {
    if (open) setLocal(stages.map((s: any) => ({ ...s })));
  }, [open, stages]);

  const add = () =>
    setLocal((p) => [
      ...p,
      {
        id: `new_${Date.now()}`,
        name: "New Stage",
        sort_order: (p.at(-1)?.sort_order || 0) + 10,
        win_probability: 50,
        is_won: false,
        is_lost: false,
        color: "#94a3b8",
        _new: true,
      },
    ]);

  const update = (i: number, patch: any) =>
    setLocal((p) => p.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const del = async (i: number) => {
    const s = local[i];
    if (
      !s._new &&
      !confirm("Delete this stage? Opportunities in it will become unassigned.")
    )
      return;
    if (!s._new) await (supabase as any).from("pipeline_stages").delete().eq("id", s.id);
    setLocal((p) => p.filter((_, idx) => idx !== i));
  };

  const saveAll = async () => {
    if (!org?.id) return;
    for (const s of local) {
      const payload = {
        name: s.name,
        sort_order: Number(s.sort_order),
        win_probability: Number(s.win_probability),
        is_won: !!s.is_won,
        is_lost: !!s.is_lost,
        color: s.color,
      };
      if (s._new)
        await (supabase as any).from("pipeline_stages").insert({ ...payload, org_id: org.id });
      else await (supabase as any).from("pipeline_stages").update(payload).eq("id", s.id);
    }
    toast({ title: "Stages saved" });
    onOpenChange(false);
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pipeline Stages</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {local.map((s, i) => (
            <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
              <Input
                className="col-span-4"
                value={s.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <Input
                className="col-span-2"
                type="number"
                value={s.sort_order}
                onChange={(e) => update(i, { sort_order: e.target.value })}
                placeholder="Order"
              />
              <Input
                className="col-span-2"
                type="number"
                value={s.win_probability}
                onChange={(e) => update(i, { win_probability: e.target.value })}
                placeholder="Win %"
              />
              <Input
                className="col-span-2"
                type="color"
                value={s.color || "#94a3b8"}
                onChange={(e) => update(i, { color: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => del(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={add}>
            <Plus className="h-4 w-4 mr-2" />
            Add Stage
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveAll}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
