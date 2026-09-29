import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TYPES = ["asset", "liability", "equity", "income", "expense"];
const typeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-700", liability: "bg-amber-100 text-amber-700",
  equity: "bg-purple-100 text-purple-700", income: "bg-emerald-100 text-emerald-700",
  expense: "bg-rose-100 text-rose-700",
};

export default function ChartOfAccountsPage() {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", name: "", type: "expense", description: "" });

  const load = async () => {
    if (!org?.id) return;
    const { data } = await (supabase as any).from("accounts").select("*").eq("org_id", org.id).order("name");
    setAccounts(data || []);
  };
  useEffect(() => { load(); }, [org?.id]);

  const save = async () => {
    if (!org?.id || !form.name.trim()) {
      toast({ title: "Account name required", variant: "destructive" });
      return;
    }
    // Auto-generate code in the background if not set so database constraints are satisfied
    const code = form.code || ("ACC-" + Date.now().toString().slice(-6) + Math.floor(10 + Math.random() * 90));
    const payload = { ...form, name: form.name.trim(), code, org_id: org.id };
    const { error } = editId
      ? await (supabase as any).from("accounts").update(payload).eq("id", editId)
      : await (supabase as any).from("accounts").insert(payload);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: editId ? "Account updated" : "Account added" });
    setOpen(false); setForm({ code: "", name: "", type: "expense", description: "" }); setEditId(null); load();
  };

  const grouped = TYPES.map(t => ({ type: t, items: accounts.filter(a => a.type === t) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your financial ledger accounts by direct account names.</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ code: "", name: "", type: "expense", description: "" }); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Account
        </Button>
      </div>

      {grouped.map(g => g.items.length > 0 && (
        <Card key={g.type}>
          <CardHeader className="pb-2"><CardTitle className="text-base capitalize flex items-center gap-2"><Badge className={typeColors[g.type]}>{g.type}</Badge> ({g.items.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {g.items.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.description || "—"}</TableCell>
                    <TableCell>{a.is_system && <Badge variant="outline" className="text-xs">System</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditId(a.id); setForm({ code: a.code, name: a.name, type: a.type, description: a.description || "" }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Account" : "Add Account"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Account Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Account Name *</Label><Input placeholder="e.g. Sales Revenue, Office Rent" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Input placeholder="Optional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
