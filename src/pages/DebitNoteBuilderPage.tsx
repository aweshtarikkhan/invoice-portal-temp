import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSequenceNumber } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { logStockMovements } from "@/lib/stock";
import { useAuth } from "@/lib/auth";

interface LineItem {
  id: string;
  item_id: string | null;
  name: string;
  description: string;
  hsn_code: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  tax_amount: number;
  amount: number;
}

function createEmptyLine(): LineItem {
  return {
    id: crypto.randomUUID(),
    item_id: null,
    name: "",
    description: "",
    hsn_code: "",
    quantity: 1,
    rate: 0,
    tax_rate: 18,
    tax_amount: 0,
    amount: 0,
  };
}

export default function DebitNoteBuilderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryBillId = searchParams.get("bill_id");
  const queryVendorId = searchParams.get("vendor_id");

  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id;

  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  const [vendorId, setVendorId] = useState(queryVendorId || "");
  const [billId, setBillId] = useState(queryBillId || "");
  const [debitNoteNumber, setDebitNoteNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("Goods returned / Damaged stock");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([createEmptyLine()]);
  const [adjustInventory, setAdjustInventory] = useState(true);
  const [saving, setSaving] = useState(false);

  const calculateLine = (line: LineItem): LineItem => {
    const qty = Number(line.quantity) || 0;
    const rate = Number(line.rate) || 0;
    const sub = qty * rate;
    const taxRate = Number(line.tax_rate) || 0;
    const taxAmt = sub * (taxRate / 100);
    return {
      ...line,
      tax_amount: Math.round(taxAmt * 100) / 100,
      amount: Math.round((sub + taxAmt) * 100) / 100,
    };
  };

  useEffect(() => {
    if (!org?.id) return;
    const loadMasters = async () => {
      const [vRes, iRes, bRes] = await Promise.all([
        supabase.from("vendors" as any).select("id, name, display_name").eq("org_id", org.id).eq("is_active", true),
        supabase.from("items").select("*").eq("org_id", org.id).eq("is_active", true),
        supabase.from("bills").select("id, bill_number, vendor_id, total, balance_due").eq("org_id", org.id).order("created_at", { ascending: false }),
      ]);
      setVendors(vRes.data || []);
      setItems(iRes.data || []);
      setBills(bRes.data || []);

      if (!isEdit) {
        const nextNum = Math.floor(1000 + Math.random() * 9000);
        setDebitNoteNumber(`DN-${nextNum}`);
      }
    };
    loadMasters();
  }, [org?.id, isEdit]);

  // Load items from bill when bill is selected
  const handleBillSelect = async (selectedBillId: string) => {
    setBillId(selectedBillId);
    if (!selectedBillId) return;

    const selectedBill = bills.find((b) => b.id === selectedBillId);
    if (selectedBill && selectedBill.vendor_id) {
      setVendorId(selectedBill.vendor_id);
    }

    const { data: bLines, error } = await supabase
      .from("bill_lines")
      .select("*")
      .eq("bill_id", selectedBillId);

    if (!error && bLines && bLines.length > 0) {
      const mapped = bLines.map((bl: any) =>
        calculateLine({
          id: crypto.randomUUID(),
          item_id: bl.item_id || null,
          name: bl.description || "Product",
          description: bl.description || "",
          hsn_code: bl.hsn || "",
          quantity: Number(bl.quantity) || 1,
          rate: Number(bl.rate) || 0,
          tax_rate: Number(bl.tax_rate) || 18,
          tax_amount: Number(bl.tax_amount) || 0,
          amount: Number(bl.amount) || 0,
        })
      );
      setLines(mapped);
      toast({
        title: "Bill items loaded",
        description: `Loaded ${mapped.length} item(s) from purchase bill. Adjust quantities to return.`,
      });
    }
  };

  const handleLineChange = (index: number, field: keyof LineItem, val: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      if (field === "item_id") {
        const found = items.find((i) => i.id === val);
        if (found) {
          next[index].name = found.name;
          next[index].rate = Number(found.purchase_price) || Number(found.unit_price) || 0;
          next[index].hsn_code = found.hsn_code || "";
        }
      }
      next[index] = calculateLine(next[index]);
      return next;
    });
  };

  const addLine = () => setLines((p) => [...p, createEmptyLine()]);
  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines((p) => p.filter((_, i) => i !== idx));
  };

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity || 0) * Number(l.rate || 0)), 0);
  const totalTax = lines.reduce((s, l) => s + (Number(l.tax_amount || 0)), 0);
  const total = subtotal + totalTax;

  const handleSave = async () => {
    if (!org?.id) return;
    if (!vendorId) {
      toast({ title: "Vendor required", description: "Please select the vendor to return goods to.", variant: "destructive" });
      return;
    }
    if (!debitNoteNumber.trim()) {
      toast({ title: "Debit Note Number required", variant: "destructive" });
      return;
    }
    const validLines = lines.filter((l) => l.name.trim() && Number(l.quantity) > 0);
    if (!validLines.length) {
      toast({ title: "At least one item required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const dnId = id || crypto.randomUUID();
      const dnPayload = {
        id: dnId,
        org_id: org.id,
        vendor_id: vendorId,
        bill_id: billId || null,
        debit_note_number: debitNoteNumber.trim(),
        issue_date: issueDate,
        currency_code: org.currency_code || "INR",
        subtotal,
        total_tax: totalTax,
        total,
        status: "issued",
        reason: reason.trim(),
        notes: notes.trim(),
        adjust_inventory: adjustInventory,
      };

      const { error: dnErr } = await supabase.from("debit_notes" as any).upsert(dnPayload);
      if (dnErr) throw dnErr;

      // Lines
      await supabase.from("debit_note_lines" as any).delete().eq("debit_note_id", dnId);
      const lineInserts = validLines.map((vl, idx) => ({
        id: crypto.randomUUID(),
        debit_note_id: dnId,
        org_id: org.id,
        item_id: vl.item_id || null,
        name: vl.name,
        description: vl.description,
        hsn_code: vl.hsn_code,
        quantity: Number(vl.quantity),
        rate: Number(vl.rate),
        tax_rate: Number(vl.tax_rate),
        tax_amount: Number(vl.tax_amount),
        amount: Number(vl.amount),
        sort_order: idx,
      }));

      const { error: linesErr } = await supabase.from("debit_note_lines" as any).insert(lineInserts);
      if (linesErr) throw linesErr;

      // Deduct stock if adjustInventory is true
      if (adjustInventory) {
        for (const l of validLines) {
          if (l.item_id) {
            const { data: itm } = await supabase.from("items").select("stock_quantity").eq("id", l.item_id).single();
            if (itm) {
              const newQty = Math.max(0, Number(itm.stock_quantity || 0) - Number(l.quantity));
              await supabase.from("items").update({ stock_quantity: newQty }).eq("id", l.item_id);
            }
          }
        }
      }

      // If bill is linked, reduce bill balance due
      if (billId) {
        const { data: bData } = await supabase.from("bills").select("balance_due").eq("id", billId).single();
        if (bData) {
          const newBal = Math.max(0, Number(bData.balance_due || 0) - total);
          await supabase.from("bills").update({ balance_due: newBal }).eq("id", billId);
        }
      }

      toast({
        title: "Debit Note Saved Successfully",
        description: `Debit Note ${debitNoteNumber} issued. Inventory and payable adjusted.`,
      });
      navigate("/debit-notes");
    } catch (err: any) {
      toast({ title: "Failed to save debit note", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/debit-notes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Debit Note (Purchase Return)</h1>
          <p className="text-sm text-muted-foreground">Return goods to vendor and adjust payable balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Vendor *</Label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.display_name || v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Link to Purchase Bill (Optional)</Label>
                <Select value={billId} onValueChange={handleBillSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Bill to auto-load items" />
                  </SelectTrigger>
                  <SelectContent>
                    {bills.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bill_number} (Total: ₹{b.total})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Debit Note # *</Label>
                <Input value={debitNoteNumber} onChange={(e) => setDebitNoteNumber(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Reason for Return</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Defective items, transit damage, excess order" />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 cursor-pointer">
                <Checkbox
                  checked={adjustInventory}
                  onCheckedChange={(v) => setAdjustInventory(!!v)}
                  className="mt-0.5"
                />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">Deduct Returned Items from Stock</div>
                  <div className="text-xs text-muted-foreground">
                    Automatically reduces product stock quantity by the returned count when saved.
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold text-sm tracking-wide text-muted-foreground uppercase">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST Tax</span>
                <span>₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total Return</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Issue Debit Note"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Item Lines */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Returned Line Items</h3>
            <Button variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Item
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Item</TableHead>
                  <TableHead className="w-[100px]">Qty</TableHead>
                  <TableHead className="w-[120px]">Rate (₹)</TableHead>
                  <TableHead className="w-[100px]">GST %</TableHead>
                  <TableHead className="w-[100px] text-right">Tax (₹)</TableHead>
                  <TableHead className="w-[120px] text-right">Total (₹)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Select
                          value={line.item_id || "manual"}
                          onValueChange={(val) => handleLineChange(idx, "item_id", val === "manual" ? null : val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">— Manual Item / Type Below —</SelectItem>
                            {items.map((it) => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.name} (Stock: {it.stock_quantity ?? 0})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Item name / description"
                          value={line.name}
                          onChange={(e) => handleLineChange(idx, "name", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, "quantity", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={line.rate}
                        onChange={(e) => handleLineChange(idx, "rate", Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(line.tax_rate)}
                        onValueChange={(v) => handleLineChange(idx, "tax_rate", Number(v))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      ₹{line.tax_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold">
                      ₹{line.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 1}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label>Notes / Remarks</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details for the vendor..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
