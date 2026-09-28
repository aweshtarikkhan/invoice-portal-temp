import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: any[];
  items: any[];
  onTransferSuccess: () => void;
}

export function TransferStockDialog({
  open,
  onOpenChange,
  branches,
  items,
  onTransferSuccess,
}: Props) {
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();

  const [fromBranchId, setFromBranchId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const availableStock = selectedItem ? Number(selectedItem.stock_quantity || 0) : 0;

  const handleTransfer = async () => {
    if (!org?.id) return;
    if (!fromBranchId || !toBranchId) {
      toast({ title: "Please select both source and destination branches", variant: "destructive" });
      return;
    }
    if (fromBranchId === toBranchId) {
      toast({ title: "Source and destination branches cannot be the same", variant: "destructive" });
      return;
    }
    if (!selectedItemId) {
      toast({ title: "Please select an item to transfer", variant: "destructive" });
      return;
    }
    if (!quantity || quantity <= 0) {
      toast({ title: "Transfer quantity must be greater than 0", variant: "destructive" });
      return;
    }
    if (quantity > availableStock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${availableStock} units available for ${selectedItem?.name}.`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const transferNumber = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;
      const transferId = crypto.randomUUID();

      const fromBranch = branches.find((b) => b.id === fromBranchId);
      const toBranch = branches.find((b) => b.id === toBranchId);

      // 1. Insert Stock Transfer Record
      const { error: trfErr } = await supabase.from("stock_transfers" as any).insert({
        id: transferId,
        org_id: org.id,
        transfer_number: transferNumber,
        from_branch_id: fromBranchId,
        to_branch_id: toBranchId,
        transfer_date: transferDate,
        status: "completed",
        notes: notes.trim() || `Transferred from ${fromBranch?.name} to ${toBranch?.name}`,
      });
      if (trfErr) throw trfErr;

      // 2. Insert Stock Transfer Line
      const { error: lineErr } = await supabase.from("stock_transfer_lines" as any).insert({
        id: crypto.randomUUID(),
        transfer_id: transferId,
        org_id: org.id,
        item_id: selectedItemId,
        quantity: quantity,
        notes: notes.trim(),
      });
      if (lineErr) throw lineErr;

      // 3. Update Branch Item Stocks for both branches
      // 3a. From Branch
      const { data: fromStock } = await supabase
        .from("branch_item_stocks" as any)
        .select("quantity")
        .eq("branch_id", fromBranchId)
        .eq("item_id", selectedItemId)
        .maybeSingle();

      const prevFrom = Number((fromStock as any)?.quantity || availableStock);
      await supabase.from("branch_item_stocks" as any).upsert({
        org_id: org.id,
        branch_id: fromBranchId,
        item_id: selectedItemId,
        quantity: Math.max(0, prevFrom - quantity),
        updated_at: new Date().toISOString(),
      }, { onConflict: "branch_id,item_id" });

      // 3b. To Branch
      const { data: toStock } = await supabase
        .from("branch_item_stocks" as any)
        .select("quantity")
        .eq("branch_id", toBranchId)
        .eq("item_id", selectedItemId)
        .maybeSingle();

      const prevTo = Number((toStock as any)?.quantity || 0);
      await supabase.from("branch_item_stocks" as any).upsert({
        org_id: org.id,
        branch_id: toBranchId,
        item_id: selectedItemId,
        quantity: prevTo + quantity,
        updated_at: new Date().toISOString(),
      }, { onConflict: "branch_id,item_id" });

      // 4. Log stock movement for full audit trail
      await supabase.from("stock_movements").insert([
        {
          org_id: org.id,
          item_id: selectedItemId,
          change_qty: -quantity,
          balance_after: Math.max(0, availableStock - quantity),
          reason: `Inter-Branch Transfer: ${fromBranch?.name} -> ${toBranch?.name}`,
          ref_type: "branch_transfer",
          ref_id: transferId,
          ref_number: transferNumber,
        },
        {
          org_id: org.id,
          item_id: selectedItemId,
          change_qty: quantity,
          balance_after: availableStock,
          reason: `Inter-Branch Transfer Receipt: from ${fromBranch?.name}`,
          ref_type: "branch_transfer",
          ref_id: transferId,
          ref_number: transferNumber,
        },
      ]);

      toast({
        title: "Stock Transferred Successfully",
        description: `Transferred ${quantity} ${selectedItem?.unit || "units"} of ${selectedItem?.name} from ${fromBranch?.name} to ${toBranch?.name}.`,
      });

      onTransferSuccess();
      onOpenChange(false);
      // Reset form
      setQuantity(1);
      setNotes("");
      setSelectedItemId("");
    } catch (err: any) {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <DialogTitle>Inter-Branch Stock Transfer</DialogTitle>
          </div>
          <DialogDescription>
            Move stock between company branches and update branch inventory balances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Branch Selectors */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="space-y-1.5">
              <Label className="text-xs">From Branch *</Label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Source Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} {b.is_default ? "(HO)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">To Branch *</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Destination Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id} disabled={b.id === fromBranchId}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Item Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Product to Transfer *</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {items
                  .filter((i) => i.type === "product")
                  .map((it) => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name} • Available: {Number(it.stock_quantity || 0)} {it.unit || "pcs"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedItem && (
              <div className="text-xs text-muted-foreground flex justify-between px-1">
                <span>Available in Organization:</span>
                <span className="font-semibold text-foreground">
                  {availableStock} {selectedItem.unit || "pcs"}
                </span>
              </div>
            )}
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity to Move *</Label>
              <Input
                type="number"
                min="1"
                max={availableStock || undefined}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transfer Date *</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Transfer Reason / Remarks</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Stock rebalancing, urgent branch request"
              className="h-9"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransfer} disabled={submitting}>
            {submitting ? "Transferring..." : "Complete Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
