import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { LockedFeature } from "@/components/subscription/LockedFeature";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useSubscription } from "@/hooks/use-subscription";
import { hasModuleAccess } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Prospect { name: string; phone: string; email: string; }

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function CampaignsPage() {
  const org = useAppStore((s) => s.organization);
  const { subscriptionPlan } = useSubscription();
  const plan = subscriptionPlan || org?.subscription_plan || 'free';
  const isFreePlan = plan === 'free';
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isFreePlan || (!plan.toLowerCase().includes('suite') && !hasModuleAccess(plan as any, 'promotion') && !plan.toLowerCase().includes('promotion') && !plan.toLowerCase().includes('marketing') && !plan.toLowerCase().includes('plan_6'))) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen">
        <LockedFeature 
          title="Promotions & Campaigns Locked"
          description="Marketing Campaigns and Promotional features require the Business Promotion or Business Suite plan."
          onUpgradeClick={() => setShowUpgrade(true)}
        />
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          onSelectPlan={(p, i, price) => { window.location.href = "/settings"; }} 
        />
      </div>
    );
  }
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [prospectForm, setProspectForm] = useState<Prospect>({ name: "", phone: "", email: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: "", channel: "sms", template_id: "", audience_type: "all_clients" });

  const seedDefaultTemplates = async (orgId: string) => {
    const defaultTemplates = [
      { org_id: orgId, name: "Special Offer / Festive Discount", channel: "sms", category: "promotional", body: "Hi {{name}}, enjoy special discounts on our services this season! Visit us or contact us today." },
      { org_id: orgId, name: "Payment Reminder Notice", channel: "sms", category: "billing", body: "Dear {{name}}, this is a gentle reminder regarding your pending invoice. Please clear at your earliest convenience." },
      { org_id: orgId, name: "Festival Greetings & Promotion", channel: "whatsapp", category: "festive", body: "Warm festival greetings to you and your family! We have exclusive offers waiting for you." },
      { org_id: orgId, name: "Exclusive Client Newsletter", channel: "email", category: "marketing", body: "Dear {{name}}, thank you for being a valued client. Check out our latest updates and promotional offers." },
      { org_id: orgId, name: "New Product / Service Launch", channel: "whatsapp", category: "announcement", body: "Hi {{name}}, we are excited to announce our new offerings. Reply to this message to know more!" },
    ];
    try {
      const { data } = await supabase.from("message_templates").insert(defaultTemplates).select("id,name,channel");
      return data || [];
    } catch (e) {
      console.error("Failed to seed templates", e);
      return [];
    }
  };

  const load = async () => {
    if (!org) return;
    const [c, t, cl, ld] = await Promise.all([
      supabase.from("campaigns").select("*, template:message_templates(name)").eq("org_id", org.id).order("created_at", { ascending: false }),
      supabase.from("message_templates").select("id,name,channel").eq("org_id", org.id),
      supabase.from("clients").select("id,display_name,phone,email").eq("org_id", org.id),
      (supabase as any).from("leads").select("id,name,phone,email,company").eq("org_id", org.id),
    ]);
    let templateList = t.data || [];
    if (templateList.length === 0) {
      const seeded = await seedDefaultTemplates(org.id);
      if (seeded && seeded.length > 0) templateList = seeded;
    }
    setCampaigns(c.data || []);
    setTemplates(templateList);
    setClients(cl.data || []);
    setLeads(ld.data || []);
  };
  useEffect(() => { load(); }, [org?.id]);

  const buildAudience = async (channel: string, audience_type: string) => {
    const addrKey = channel === "email" ? "email" : "phone";

    const toRecipient = (id: string | null, displayName: string, phone: string | null, email: string | null) => {
      const addr = channel === "email" ? (email || null) : (phone || null);
      if (!addr) return null;
      return { client_id: id, name: displayName, to_address: addr, vars: { name: displayName }, org_id: org!.id };
    };

    let items: (ReturnType<typeof toRecipient>)[] = [];

    if (audience_type === "all_clients") {
      let list = clients.length ? clients : (await supabase.from("clients").select("id,display_name,phone,email").eq("org_id", org!.id)).data || [];
      items = list.map((c: any) => toRecipient(c.id, c.display_name, c.phone, c.email));
    } else if (audience_type === "all_leads") {
      let list = leads.length ? leads : ((await (supabase as any).from("leads").select("id,name,phone,email").eq("org_id", org!.id)).data || []);
      items = list.map((l: any) => toRecipient(l.id, l.name, l.phone, l.email));
    } else if (audience_type === "overdue") {
      const allClients = clients.length ? clients : (await supabase.from("clients").select("id,display_name,phone,email").eq("org_id", org!.id)).data || [];
      const { data: ovd } = await supabase.from("invoices").select("client_id").eq("org_id", org!.id).gt("balance_due", 0).lt("due_date", new Date().toISOString().split("T")[0]);
      const ids = new Set((ovd || []).map((i: any) => i.client_id));
      items = allClients.filter((c: any) => ids.has(c.id)).map((c: any) => toRecipient(c.id, c.display_name, c.phone, c.email));
    } else if (audience_type === "custom_clients") {
      items = clients.filter((c: any) => selectedClientIds.includes(c.id)).map((c: any) => toRecipient(c.id, c.display_name, c.phone, c.email));
    } else if (audience_type === "custom_leads") {
      items = leads.filter((l: any) => selectedLeadIds.includes(l.id)).map((l: any) => toRecipient(l.id, l.name, l.phone, l.email));
    } else if (audience_type === "prospects") {
      items = prospects
        .filter(p => channel === "email" ? !!p.email : !!p.phone)
        .map(p => ({ client_id: null, name: p.name, to_address: channel === "email" ? p.email : p.phone, vars: { name: p.name }, org_id: org!.id }));
    }

    return items.filter(Boolean) as any[];
  };

  const create = async () => {
    if (!form.name || !form.template_id) return toast.error("Name & template required");
    const audience = await buildAudience(form.channel, form.audience_type);
    if (audience.length === 0) return toast.error("No recipients with valid contact info found. Please ensure clients/leads have phone or email.");

    const { data: campaign, error } = await supabase.from("campaigns").insert({
      org_id: org!.id,
      name: form.name,
      channel: form.channel,
      template_id: form.template_id,
      audience_type: form.audience_type === "overdue" ? "overdue" : (form.audience_type.includes("custom") || form.audience_type === "prospects" ? "manual" : "all"),
      total_count: audience.length,
    }).select().single();
    if (error || !campaign) return toast.error(error?.message || "Failed");

    const recipients = audience.map((r) => ({ ...r, campaign_id: campaign.id }));
    await supabase.from("campaign_recipients").insert(recipients);

    toast.success(`Campaign created with ${audience.length} recipients`);
    setOpen(false);
    setForm({ name: "", channel: "sms", template_id: "", audience_type: "all_clients" });
    setSelectedClientIds([]);
    setSelectedLeadIds([]);
    setProspects([]);
    setProspectForm({ name: "", phone: "", email: "" });
    load();
  };

  const sendNow = async (id: string) => {
    if (!confirm("Send this campaign now to all pending recipients?")) return;
    const t = toast.loading("Sending...");
    const { data, error } = await supabase.functions.invoke("send-campaign", { body: { campaign_id: id } });
    toast.dismiss(t);
    if (error) return toast.error(error.message || "Failed");
    toast.success(`Sent: ${data?.sent}, Failed: ${data?.failed}`);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete campaign?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    load();
  };

  const channelTpls = templates.filter((t) => t.channel === form.channel);
  const displayTpls = channelTpls.length > 0 ? channelTpls : templates;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-sm text-muted-foreground">Bulk promotional broadcasts via SMS, WhatsApp, and Email to your contacts.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Campaign</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>All Campaigns</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent / Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.channel}</Badge></TableCell>
                  <TableCell>{c.template?.name || "—"}</TableCell>
                  <TableCell className="text-xs capitalize">{c.audience_type.replace("_", " ")}</TableCell>
                  <TableCell><Badge className={STATUS_COLOR[c.status]}>{c.status}</Badge></TableCell>
                  <TableCell>{c.sent_count} / {c.total_count} {c.failed_count > 0 && <span className="text-red-600 text-xs">({c.failed_count} failed)</span>}</TableCell>
                  <TableCell className="text-xs">{format(new Date(c.created_at), "dd MMM HH:mm")}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="space-x-1">
                    {c.status === "draft" && <Button size="sm" onClick={() => sendNow(c.id)}><Send className="h-3 w-3 mr-1" />Send</Button>}
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {campaigns.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No campaigns yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-sm font-medium">Campaign Name</Label>
              <Input 
                placeholder="e.g. Diwali Special Offer 2026"
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Channel</Label>
              <Select 
                value={form.channel} 
                onValueChange={(v) => {
                  setForm({ ...form, channel: v, template_id: "" });
                }}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select Channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Message Template</Label>
                <Button 
                  type="button" 
                  variant="link" 
                  className="h-auto p-0 text-xs text-primary font-medium"
                  onClick={() => {
                    setOpen(false);
                    navigate("/marketing/templates");
                  }}
                >
                  Manage Templates →
                </Button>
              </div>
              <Select 
                value={form.template_id} 
                onValueChange={(v) => setForm({ ...form, template_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={displayTpls.length > 0 ? "Choose a template..." : "No templates found"} />
                </SelectTrigger>
                <SelectContent>
                  {displayTpls.length > 0 ? (
                    displayTpls.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.channel && <span className="text-xs text-muted-foreground ml-1">({t.channel.toUpperCase()})</span>}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>
                      No templates found for {form.channel.toUpperCase()}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {displayTpls.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No templates found for this channel. Click "Manage Templates" to create one.
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Audience</Label>
              <Select
                value={form.audience_type}
                onValueChange={(v) => setForm({ ...form, audience_type: v })}
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select Audience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_clients">All Clients ({clients.length})</SelectItem>
                  <SelectItem value="all_leads">All Leads ({leads.length})</SelectItem>
                  <SelectItem value="overdue">Clients with Overdue Invoices</SelectItem>
                  <SelectItem value="custom_clients">Custom Clients ({selectedClientIds.length} selected)</SelectItem>
                  <SelectItem value="custom_leads">Custom Leads ({selectedLeadIds.length} selected)</SelectItem>
                  <SelectItem value="prospects">Manual Prospects ({prospects.length} added)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Clients */}
            {form.audience_type === "custom_clients" && (
              <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between pb-2 border-b">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Clients</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs"
                    onClick={() => { if (selectedClientIds.length === clients.length) setSelectedClientIds([]); else setSelectedClientIds(clients.map(c => c.id)); }}
                  >{selectedClientIds.length === clients.length ? "Deselect All" : "Select All"}</Button>
                </div>
                <ScrollArea className="h-40">
                  <div className="space-y-2 pt-2">
                    {clients.map(c => (
                      <div key={c.id} className="flex items-center space-x-2">
                        <Checkbox id={`client-${c.id}`} checked={selectedClientIds.includes(c.id)}
                          onCheckedChange={(checked) => { if (checked) setSelectedClientIds([...selectedClientIds, c.id]); else setSelectedClientIds(selectedClientIds.filter(id => id !== c.id)); }} />
                        <label htmlFor={`client-${c.id}`} className="text-sm cursor-pointer">
                          {c.display_name}
                          <span className="text-xs text-muted-foreground ml-1">{c.phone || c.email || <span className="text-red-400">No contact</span>}</span>
                        </label>
                      </div>
                    ))}
                    {clients.length === 0 && <div className="text-sm text-muted-foreground">No clients found</div>}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Custom Leads */}
            {form.audience_type === "custom_leads" && (
              <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between pb-2 border-b">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Leads</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs"
                    onClick={() => { if (selectedLeadIds.length === leads.length) setSelectedLeadIds([]); else setSelectedLeadIds(leads.map((l: any) => l.id)); }}
                  >{selectedLeadIds.length === leads.length ? "Deselect All" : "Select All"}</Button>
                </div>
                <ScrollArea className="h-40">
                  <div className="space-y-2 pt-2">
                    {leads.map((l: any) => (
                      <div key={l.id} className="flex items-center space-x-2">
                        <Checkbox id={`lead-${l.id}`} checked={selectedLeadIds.includes(l.id)}
                          onCheckedChange={(checked) => { if (checked) setSelectedLeadIds([...selectedLeadIds, l.id]); else setSelectedLeadIds(selectedLeadIds.filter(id => id !== l.id)); }} />
                        <label htmlFor={`lead-${l.id}`} className="text-sm cursor-pointer">
                          {l.name} {l.company ? `(${l.company})` : ""}
                          <span className="text-xs text-muted-foreground ml-1">{l.phone || l.email || <span className="text-red-400">No contact</span>}</span>
                        </label>
                      </div>
                    ))}
                    {leads.length === 0 && <div className="text-sm text-muted-foreground">No leads found</div>}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Manual Prospects */}
            {form.audience_type === "prospects" && (
              <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Prospects Manually</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Name" value={prospectForm.name} onChange={e => setProspectForm({ ...prospectForm, name: e.target.value })} className="h-8 text-sm" />
                  <Input maxLength={15} placeholder="Phone" value={prospectForm.phone} onChange={e => setProspectForm({ ...prospectForm, phone: e.target.value.replace(/\D/g, '') })} className="h-8 text-sm" />
                  <Input placeholder="Email" value={prospectForm.email} onChange={e => setProspectForm({ ...prospectForm, email: e.target.value })} className="h-8 text-sm" />
                  <Button size="sm" className="h-8 px-3 shrink-0"
                    onClick={() => {
                      if (!prospectForm.name || (!prospectForm.phone && !prospectForm.email)) return toast.error("Name and phone/email required");
                      if (prospectForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prospectForm.email)) return toast.error("Invalid email address");
                      if (prospectForm.phone && prospectForm.phone.length < 10) return toast.error("Phone number must be at least 10 digits");
                      setProspects([...prospects, { ...prospectForm }]);
                      setProspectForm({ name: "", phone: "", email: "" });
                    }}
                  ><UserPlus className="w-3.5 h-3.5" /></Button>
                </div>
                <ScrollArea className="h-32 mt-2">
                  <div className="space-y-1.5">
                    {prospects.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-white border rounded px-2 py-1 text-xs">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground">{p.phone || p.email}</span>
                        <button onClick={() => setProspects(prospects.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-2"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    {prospects.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Add prospects above to include them in the campaign</p>}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={!form.name || !form.template_id}>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}




