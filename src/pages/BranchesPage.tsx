import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { logStockMovements } from "@/lib/stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ArrowLeft, ArrowRightLeft, Truck, Package, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function BranchesPage() {
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", gstin: "", is_default: false });

  // Inter-Branch Stock Transfer States
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [transferForm, setTransferForm] = useState({
    fromBranchId: "",
    toBranchId: "",
    itemId: "",
    quantity: "1",
    transferDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const load = async () => {
    if (!org?.id) return;
    const { data } = await (supabase as any).from("branches").select("*").eq("org_id", org.id).order("name");
    setList(data || []);

    // Load available product items
    const { data: itemData } = await supabase
      .from("items")
      .select("id, name, type, stock_quantity, unit")
      .eq("org_id", org.id)
      .eq("type", "product")
      .order("name");
    setItems(itemData || []);

    // Load recent stock transfers
    const { data: mvData } = await (supabase as any)
      .from("stock_movements")
      .select("*, items(name, unit)")
      .eq("org_id", org.id)
      .ilike("reason", "%Transfer%")
      .order("created_at", { ascending: false })
      .limit(15);
    setRecentTransfers(mvData || []);
  };

  useEffect(() => { load(); }, [org?.id]);

  const save = async () => {
    if (!org?.id || !form.name.trim()) { toast({ title: "Name required", variant: "destructive" }); return; }
    if (form.is_default) await (supabase as any).from("branches").update({ is_default: false }).eq("org_id", org.id);
    const payload = { ...form, name: form.name.trim(), org_id: org.id };
    const { error } = editId
      ? await (supabase as any).from("branches").update(payload).eq("id", editId)
      : await (supabase as any).from("branches").insert(payload);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setOpen(false); setForm({ name: "", code: "", gstin: "", is_default: false }); setEditId(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete branch?")) return;
    await (supabase as any).from("branches").delete().eq("id", id);
    load();
  };

  const handleExecuteTransfer = async () => {
    if (!org?.id) return;
    const { fromBranchId, toBranchId, itemId, quantity, notes } = transferForm;
    const qty = parseFloat(quantity);

    if (!fromBranchId) {
      toast({ title: "Source Branch Required", description: "Please select the origin branch.", variant: "destructive" });
      return;
    }
    if (!toBranchId) {
      toast({ title: "Destination Branch Required", description: "Please select the destination branch.", variant: "destructive" });
      return;
    }
    if (fromBranchId === toBranchId) {
      toast({ title: "Invalid Transfer", description: "Origin and destination branch cannot be the same.", variant: "destructive" });
      return;
    }
    if (!itemId) {
      toast({ title: "Item Required", description: "Please select a product to transfer.", variant: "destructive" });
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Invalid Quantity", description: "Transfer quantity must be greater than zero.", variant: "destructive" });
      return;
    }

    const selectedItem = items.find(i => i.id === itemId);
    const currentStock = Number(selectedItem?.stock_quantity || 0);

    if (qty > currentStock) {
      toast({
        title: "Insufficient Stock",
        description: `Requested ${qty}, but total available stock is only ${currentStock} ${selectedItem?.unit || 'units'}.`,
        variant: "destructive"
      });
      return;
    }

    setTransferLoading(true);
    try {
      const fromBranch = list.find(b => b.id === fromBranchId);
      const toBranch = list.find(b => b.id === toBranchId);
      const fromName = fromBranch?.name || "Source Branch";
      const toName = toBranch?.name || "Destination Branch";

      // Log Outflow and Inflow movements without changing consolidated total
      await logStockMovements([
        {
          orgId: org.id,
          itemId,
          changeQty: -qty, // Outflow from source
          balanceAfter: currentStock - qty,
          reason: `Inter-Branch Transfer OUT to ${toName}${notes ? `: ${notes}` : ""}`,
          refType: "manual",
          createdBy: user?.id || null,
        },
        {
          orgId: org.id,
          itemId,
          changeQty: qty, // Inflow to destination
          balanceAfter: currentStock,
          reason: `Inter-Branch Transfer IN from ${fromName}${notes ? `: ${notes}` : ""}`,
          refType: "manual",
          createdBy: user?.id || null,
        }
      ]);

      if (user) {
        await logAudit({
          orgId: org.id,
          userId: user.id,
          entityType: "stock_transfer",
          action: "transfer",
          description: `Transferred ${qty} ${selectedItem?.unit || 'units'} of ${selectedItem?.name} from ${fromName} to ${toName}`,
          metadata: {
            item_id: itemId,
            item_name: selectedItem?.name,
            quantity: qty,
            from_branch_id: fromBranchId,
            from_branch_name: fromName,
            to_branch_id: toBranchId,
            to_branch_name: toName,
            notes,
          }
        });
      }

      toast({
        title: "Stock Transferred Successfully!",
        description: `Moved ${qty} ${selectedItem?.unit || 'units'} from "${fromName}" to "${toName}".`,
      });

      setTransferOpen(false);
      setTransferForm({
        fromBranchId: "",
        toBranchId: "",
        itemId: "",
        quantity: "1",
        transferDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      load();
    } catch (err: any) {
      toast({ title: "Transfer Failed", description: err.message, variant: "destructive" });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Branches & Stock Transfer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage multiple branch locations, GSTINs, and inter-branch inventory transfers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
          </Button>
          {list.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
              onClick={() => {
                setTransferForm(prev => ({
                  ...prev,
                  fromBranchId: list[0]?.id || "",
                  toBranchId: list[1]?.id || "",
                }));
                setTransferOpen(true);
              }}
            >
              <ArrowRightLeft className="h-4 w-4 mr-1" /> Transfer Stock
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditId(null); setForm({ name: "", code: "", gstin: "", is_default: false }); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Branch
          </Button>
        </div>
      </div>

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Registered Branches ({list.length})</CardTitle>
              <CardDescription className="text-xs">All active operating locations with respective GST registration</CardDescription>
            </div>
            {list.length < 2 && (
              <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">
                Add 2 or more branches to enable Inter-Branch Transfers
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Branch Code</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    No branches configured. Add your first branch above.
                  </TableCell>
                </TableRow>
              ) : (
                list.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.name} {b.is_default && <Badge className="ml-2 bg-blue-50 text-blue-700 border-blue-200" variant="outline">Default</Badge>}
                    </TableCell>
                    <TableCell>{b.code || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{b.gstin || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditId(b.id); setForm({ name: b.name, code: b.code || "", gstin: b.gstin || "", is_default: b.is_default }); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!b.is_default && (
                        <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Inter-Branch Stock Transfers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" />
            Inter-Branch Stock Movement Log
          </CardTitle>
          <CardDescription className="text-xs">
            Audit-verified records of inventory transfers between branch locations. Consolidated stock is always mathematically preserved without duplicate counts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Package className="h-8 w-8 text-slate-300" />
              <span>No stock transfers recorded yet.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Item / Product</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead>Transfer Reason / Route</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransfers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(m.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {m.items?.name || "Product"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={Number(m.change_qty) > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                        {Number(m.change_qty) > 0 ? "Transfer In" : "Transfer Out"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {m.reason}
                    </TableCell>
                    <TableCell className={`text-right font-semibold text-sm ${Number(m.change_qty) > 0 ? "text-emerald-600" : "text-slate-700"}`}>
                      {Number(m.change_qty) > 0 ? `+${m.change_qty}` : m.change_qty} {m.items?.unit || ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Branch Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Branch" : "Add Branch"}</DialogTitle>
            <DialogDescription>Define a branch location, branch code, and GSTIN for invoicing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div><Label>Branch Name *</Label><Input placeholder="e.g. Connaught Place Branch" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Branch Code</Label><Input placeholder="e.g. DEL-01" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div><Label>GSTIN</Label><Input placeholder="e.g. 07AAAAA0000A1Z5" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} /></div>
            <label className="flex items-center gap-2 text-sm pt-1 cursor-pointer">
              <input type="checkbox" checked={form.is_default} onChange={e => setForm({ ...form, is_default: e.target.checked })} /> Mark as default branch
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editId ? "Update" : "Add Branch"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inter-Branch Stock Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-600" />
              Transfer Stock Between Branches
            </DialogTitle>
            <DialogDescription>
              Move stock seamlessly from one branch to another without inventory duplication or calculation errors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Source Branch (From) *</Label>
                <Select
                  value={transferForm.fromBranchId}
                  onValueChange={(val) => setTransferForm(prev => ({ ...prev, fromBranchId: val }))}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Destination Branch (To) *</Label>
                <Select
                  value={transferForm.toBranchId}
                  onValueChange={(val) => setTransferForm(prev => ({ ...prev, toBranchId: val }))}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {list.filter(b => b.id !== transferForm.fromBranchId).map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Product / Item to Transfer *</Label>
              <Select
                value={transferForm.itemId}
                onValueChange={(val) => setTransferForm(prev => ({ ...prev, itemId: val }))}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock_quantity || 0} {item.unit || ''})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Transfer Quantity *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="any"
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="e.g. 5"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Transfer Date</Label>
                <Input
                  type="date"
                  value={transferForm.transferDate}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, transferDate: e.target.value }))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Transfer Remarks / Notes</Label>
              <Input
                value={transferForm.notes}
                onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Urgent stock replenishment"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)} disabled={transferLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteTransfer}
              disabled={transferLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {transferLoading ? "Processing Transfer..." : "Confirm Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
