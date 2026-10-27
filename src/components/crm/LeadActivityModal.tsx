import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import {
  Phone,
  Users,
  Mail,
  ClipboardList,
  CheckCircle2,
  Calendar,
  Clock,
  Bell,
  RotateCw,
  Plus,
  Check,
  Sparkles
} from "lucide-react";
import {
  fetchCustomActivityTypes,
  saveCustomActivityType,
  triggerActionLoggedLeadStatusUpdate,
} from "@/lib/crm-automations";

interface LeadActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: {
    id: string;
    name: string;
    company?: string | null;
    status?: string | null;
    owner_id?: string | null;
    [key: string]: any;
  } | null;
  onSaved?: () => void;
}

const PRIORITIES = [
  { v: "Low", l: "Low", dotColor: "bg-slate-400" },
  { v: "Medium", l: "Medium", dotColor: "bg-blue-500" },
  { v: "High", l: "High", dotColor: "bg-amber-500" },
  { v: "Urgent", l: "Urgent", dotColor: "bg-red-500" },
];

const REMINDERS = [
  { v: "none", l: "None" },
  { v: "10_min", l: "10 minutes before" },
  { v: "1_hour", l: "1 hour before" },
  { v: "1_day", l: "1 day before" },
  { v: "custom", l: "Custom Date & Time" },
];

const REPEATS = [
  { v: "none", l: "None" },
  { v: "daily", l: "Daily" },
  { v: "weekly", l: "Weekly" },
];

const STATUSES = [
  { v: "Pending", l: "Pending" },
  { v: "In Progress", l: "In Progress" },
  { v: "Completed", l: "Completed" },
];

export function LeadActivityModal({ open, onOpenChange, lead, onSaved }: LeadActivityModalProps) {
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { toast } = useToast();

  const [types, setTypes] = useState<string[]>([]);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("Call");
  const [priority, setPriority] = useState("Medium");
  const [dueAt, setDueAt] = useState("");
  const [reminderType, setReminderType] = useState("none");
  const [customReminderAt, setCustomReminderAt] = useState("");
  const [repeatInterval, setRepeatInterval] = useState("none");
  const [status, setStatus] = useState("Pending");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // Set default due date to 1 hour from now
  useEffect(() => {
    if (open) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      setDueAt(format(now, "yyyy-MM-dd'T'HH:mm"));
      setTitle("");
      setActivityType("Call");
      setPriority("Medium");
      setReminderType("none");
      setCustomReminderAt("");
      setRepeatInterval("none");
      setStatus("Pending");
      setDescription("");
      setIsCreatingType(false);
      setNewTypeName("");

      if (org?.id) {
        fetchCustomActivityTypes(org.id).then((t) => setTypes(t));
      }
    }
  }, [open, org?.id]);

  const minDateTime = useMemo(() => {
    return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  }, [open]);

  const handleAddNewType = async () => {
    if (!newTypeName.trim() || !org?.id) return;
    const trimmed = newTypeName.trim();
    const updated = await saveCustomActivityType(org.id, trimmed);
    setTypes(updated);
    setActivityType(trimmed);
    setNewTypeName("");
    setIsCreatingType(false);
    toast({ title: "Task Type added", description: `"${trimmed}" is now available.` });
  };

  const handleSave = async () => {
    if (!org?.id || !lead?.id) return;
    if (!title.trim()) {
      toast({ title: "Task Title is required", variant: "destructive" });
      return;
    }
    if (!dueAt) {
      toast({ title: "Due Date & Time is required", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const finalReminder =
        reminderType === "custom" && customReminderAt
          ? `custom:${customReminderAt}`
          : reminderType;

      const payload: any = {
        org_id: org.id,
        lead_id: lead.id,
        subject: title.trim(),
        activity_type: activityType,
        priority,
        due_at: new Date(dueAt).toISOString(),
        reminder_type: finalReminder,
        repeat_interval: repeatInterval,
        status,
        body: description.trim() || null,
        owner_id: lead.owner_id || null,
        completed_at: status === "Completed" ? new Date().toISOString() : null,
      };

      const { error } = await (supabase as any).from("activities").insert(payload);
      if (error) throw error;

      // Auto update status if automation rule is active
      const updatedStatus = await triggerActionLoggedLeadStatusUpdate(org.id, lead.id, lead.status || undefined);

      toast({
        title: "Activity Logged",
        description: updatedStatus
          ? `Action saved & lead status updated to "${updatedStatus}".`
          : "Activity task saved successfully.",
      });

      onOpenChange(false);
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Error saving activity:", err);
      toast({ title: "Failed to save activity", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-[#0d2346] dark:text-slate-100">
                Log New Activity Task
              </DialogTitle>
              {lead && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lead: <span className="font-semibold text-slate-800 dark:text-slate-200">{lead.name}</span>
                  {lead.company && ` (${lead.company})`}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Task Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow-up demo call with client"
              className="h-10 text-sm focus-visible:ring-1 focus-visible:ring-[#0d2346]"
            />
          </div>

          {/* Row 1: Task Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Task Type */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Task Type</Label>
                {!isCreatingType && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingType(true)}
                    className="text-[11px] text-[#e77817] hover:underline font-semibold flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Create New
                  </button>
                )}
              </div>

              {isCreatingType ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="New type name..."
                    className="h-9 text-xs"
                    autoFocus
                  />
                  <Button size="sm" type="button" onClick={handleAddNewType} className="h-9 px-2 text-xs bg-[#0d2346] text-white">
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsCreatingType(false);
                      setNewTypeName("");
                    }}
                    className="h-9 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={activityType} onValueChange={(val) => {
                  if (val === "__create_new__") {
                    setIsCreatingType(true);
                  } else {
                    setActivityType(val);
                  }
                }}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        {t}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create_new__" className="text-xs text-[#e77817] font-semibold border-t">
                      + Create New Type...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.v} value={p.v} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.dotColor}`} />
                        <span>{p.l}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Due Date & Time & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date & Time */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Due Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={dueAt}
                min={minDateTime}
                onChange={(e) => setDueAt(e.target.value)}
                className="h-10 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Select today or a future date & time.</p>
            </div>

            {/* Reminder */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Bell className="w-3 h-3 text-blue-500" /> Reminder
              </Label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select reminder" />
                </SelectTrigger>
                <SelectContent>
                  {REMINDERS.map((r) => (
                    <SelectItem key={r.v} value={r.v} className="text-xs">
                      {r.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reminderType === "custom" && (
                <Input
                  type="datetime-local"
                  value={customReminderAt}
                  min={minDateTime}
                  max={dueAt || undefined}
                  onChange={(e) => setCustomReminderAt(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              )}
              <p className="text-[10px] text-muted-foreground">WhatsApp & Email notifications will be dispatched.</p>
            </div>
          </div>

          {/* Row 3: Repeat & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Repeat */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-slate-400" /> Repeat
              </Label>
              <Select value={repeatInterval} onValueChange={setRepeatInterval}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {REPEATS.map((rp) => (
                    <SelectItem key={rp.v} value={rp.v} className="text-xs">
                      {rp.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Pending" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((st) => (
                    <SelectItem key={st.v} value={st.v} className="text-xs">
                      {st.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter activity description, discussion agenda, or meeting details..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-[#0d2346] hover:bg-[#163768] text-white shadow-sm"
          >
            {saving ? "Logging..." : "Log Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
