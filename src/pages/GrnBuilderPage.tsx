import { useEffect, useMemo, useState, Fragment } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatSequenceNumber } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { logStockMovements } from "@/lib/stock";
import { AddWarehouseDialog } from "@/components/shared/AddWarehouseDialog";

interface Line {
  item_id: string;
  po_line_id: string | null;
  description: string;
  quantity: string;
  unit_cost: string;
  tax_rate: string;
  batch_no: string;
  serial_no: string;
  expiry_date: string;
  expiry_warning?: string;
}
const emptyLine = (): Line => ({ item_id: "", po_line_id: null, description: "", quantity: "1", unit_cost: "", tax_rate: "0", batch_no: "", serial_no: "", expiry_date: "" });

export default function GrnBuilderPage() {
  const org = useAppStore((s) => s.organization);
  const { user } = useAuth();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const poFromQuery = sp.get("po");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [poId, setPoId] = useState<string>("");
  const [vendorId, setVendorId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [addWarehouseOpen, setAddWarehouseOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [grnNumber, setGrnNumber] = useState("");
  const [grnDate, setGrnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transporter, setTransporter] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      const [v, it, wh, br, p, o, tr] = await Promise.all([
        (supabase as any).from("vendors").select("id,name,display_name").eq("org_id", org.id).order("name"),
        (supabase as any).from("items").select("id,name,track_batches,track_serials,purchase_price,purchase_price_type,tax_id,sku").eq("org_id", org.id).order("name"),
        (supabase as any).from("warehouses").select("id,name,is_default").eq("org_id", org.id),
        (supabase as any).from("branches").select("id,name,is_default").eq("org_id", org.id),
        (supabase as any).from("purchase_orders").select("id,po_number,vendor_id,warehouse_id,branch_id").eq("org_id", org.id).in("status", ["sent", "partial", "draft"]).order("po_date", { ascending: false }),
        (supabase as any).from("organizations").select("grn_next_number,grn_prefix").eq("id", org.id).maybeSingle(),
        (supabase as any).from("tax_rates").select("*").eq("org_id", org.id),
      ]);
      setVendors(v.data || []);
      setItems(it.data || []);
      setWarehouses(wh.data || []);
      setBranches(br.data || []);
      setPos(p.data || []);
      setTaxRates(tr.data || []);
      const defBr = (br.data || []).find((x: any) => x.is_default);
      if (defBr) setBranchId(defBr.id);
      const defWh = (wh.data || []).find((x: any) => x.is_default);
      if (defWh) setWarehouseId(defWh.id);
      if (!id) {
        const prefix = o.data?.grn_prefix || "GRN-";
        const next = o.data?.grn_next_number || 1;
        setGrnNumber(formatSequenceNumber(prefix, next, "GRN"));
        if (poFromQuery) await loadFromPo(poFromQuery);
      } else {
        loadGrn();
      }
    })();
  }, [org?.id, id]);

  const loadFromPo = async (poid: string) => {
    setPoId(poid);
    const { data: po } = await (supabase as any).from("purchase_orders").select("*").eq("id", poid).maybeSingle();
    const { data: pl } = await (supabase as any).from("purchase_order_lines").select("*").eq("po_id", poid).order("sort_order");
    if (po) {
      setVendorId(po.vendor_id || "");
      setWarehouseId(po.warehouse_id || "");
      setBranchId(po.branch_id || "");
    }
    if (pl) setLines(pl.map((l: any) => ({
      item_id: l.item_id || "", po_line_id: l.id,
      description: l.description || "",
      quantity: String(Math.max(0, Number(l.quantity) - Number(l.received_quantity || 0))),
      unit_cost: String(l.rate || 0),
      tax_rate: String(l.tax_rate || 0),
      batch_no: "", serial_no: "", expiry_date: "",
    })));
  };

  const loadGrn = async () => {
    const { data: g } = await (supabase as any).from("grns").select("*").eq("id", id).maybeSingle();
    const { data: gl } = await (supabase as any).from("grn_lines").select("*").eq("grn_id", id).order("sort_order");
    if (g) {
      setPoId(g.po_id || "");
      setVendorId(g.vendor_id || "");
      setWarehouseId(g.warehouse_id || "");
      setBranchId(g.branch_id || "");
      setGrnNumber(g.grn_number);
      setGrnDate(g.grn_date);
      setVehicleNumber(g.vehicle_number || "");
      setTransporter(g.transporter || "");
      setNotes(g.notes || "");
    }
    if (gl) setLines(gl.map((l: any) => ({
      item_id: l.item_id || "", po_line_id: l.po_line_id, description: l.description,
      quantity: String(l.quantity), unit_cost: String(l.unit_cost),
      tax_rate: String(l.tax_rate || 0),
      batch_no: l.batch_no || "", serial_no: l.serial_no || "", expiry_date: l.expiry_date || "",
    })));
  };

  const { baseTotal, taxTotal, grandTotal } = useMemo(() => {
    let base = 0;
    let tax = 0;
    lines.forEach(l => {
      const q = Number(l.quantity) || 0;
      const c = Number(l.unit_cost) || 0;
      const tr = Number(l.tax_rate) || 0;
      const lineBase = q * c;
      const lineTax = lineBase * (tr / 100);
      base += lineBase;
      tax += lineTax;
    });
    return {
      baseTotal: base,
      taxTotal: tax,
      grandTotal: base + tax,
    };
  }, [lines]);

  const pickItem = (idx: number, itemId: string) => {
    const it = items.find(x => x.id === itemId);
    const x = [...lines];
    x[idx].item_id = itemId;
    if (it) {
      let extraDesc = "";
      if (it.custom_field_values && it.custom_field_values.length > 0) {
        extraDesc = it.custom_field_values
          .filter((cf: any) => cf.value)
          .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.value}`)
          .join("\n");
      }
      x[idx].description = it.name + (extraDesc ? `\n${extraDesc}` : "");
      let __rate = Number(it.purchase_price || it.unit_price) || 0;
      const __priceType = it.purchase_price_type || "without_tax";
      const itemTax = it.tax_id ? taxRates.find((t: any) => t.id === it.tax_id) : null;
      const itemTaxRate = Number(itemTax?.rate || 0);
      if (__priceType === "with_tax" && itemTaxRate > 0) {
        __rate = Number((__rate / (1 + itemTaxRate / 100)).toFixed(2));
      }
      x[idx].unit_cost = String(__rate);
      x[idx].tax_rate = String(itemTaxRate);
    }
    setLines(x);
  };

  const save = async () => {
    if (!org?.id || !vendorId) { toast({ title: "Vendor required", variant: "destructive" }); return; }
    if (!lines.some(l => l.item_id && Number(l.quantity) > 0)) { toast({ title: "Add at least one received line", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload: any = {
        org_id: org.id, vendor_id: vendorId, po_id: poId || null,
        warehouse_id: warehouseId || null, branch_id: branchId || null,
        grn_number: grnNumber, grn_date: grnDate, status: "received",
        vehicle_number: vehicleNumber || null, transporter: transporter || null,
        notes: notes || null, created_by: user?.id || null,
      };
      let grnId = id;
      if (id) {
        const { error } = await (supabase as any).from("grns").update(payload).eq("id", id);
        if (error) throw error;
        await (supabase as any).from("grn_lines").delete().eq("grn_id", id);
      } else {
        const { data, error } = await (supabase as any).from("grns").insert(payload).select().single();
        if (error) throw error;
        grnId = data.id;
        const { data: o } = await (supabase as any).from("organizations").select("grn_next_number").eq("id", org.id).maybeSingle();
        await (supabase as any).from("organizations").update({ grn_next_number: (o?.grn_next_number || 1) + 1 }).eq("id", org.id);
      }
      const linePayloads = lines.filter(l => l.item_id && Number(l.quantity) > 0).map((l, idx) => ({
        org_id: org.id, grn_id: grnId, po_line_id: l.po_line_id, item_id: l.item_id,
        description: l.description,
        quantity: Number(l.quantity), unit_cost: Number(l.unit_cost),
        amount: Number(l.quantity) * Number(l.unit_cost),
        batch_no: l.batch_no || null, serial_no: l.serial_no || null,
        expiry_date: l.expiry_date || null, sort_order: idx,
      }));
      const { error: lErr } = await (supabase as any).from("grn_lines").insert(linePayloads);
      if (lErr) throw lErr;

      // Only post stock movements + update item stock + PO received qty on first save (new GRN)
      if (!id) {
        // Update item stock_quantity and post stock movements
        for (const lp of linePayloads) {
          const { data: it } = await (supabase as any).from("items").select("stock_quantity").eq("id", lp.item_id).maybeSingle();
          const currentStock = Number(it?.stock_quantity || 0);
          const newQty = currentStock + Number(lp.quantity);
          await (supabase as any).from("items").update({ stock_quantity: newQty }).eq("id", lp.item_id);
          
          await (supabase as any).from("stock_movements").insert({
            org_id: org.id,
            item_id: lp.item_id,
            change_qty: Number(lp.quantity),
            balance_after: newQty,
            reason: `GRN ${grnNumber}`,
            ref_type: "grn",
            ref_id: grnId,
            ref_number: grnNumber,
            batch_no: lp.batch_no || null,
            serial_no: lp.serial_no || null,
            expiry_date: lp.expiry_date || null,
            unit_cost: lp.unit_cost,
            warehouse_id: warehouseId || null,
            created_by: user?.id || null,
          });
        }
        // Update PO line received_quantity
        for (const lp of linePayloads) {
          if (!lp.po_line_id) continue;
          const { data: pl } = await (supabase as any).from("purchase_order_lines").select("received_quantity,quantity").eq("id", lp.po_line_id).maybeSingle();
          const recv = Number(pl?.received_quantity || 0) + Number(lp.quantity);
          await (supabase as any).from("purchase_order_lines").update({ received_quantity: recv }).eq("id", lp.po_line_id);
        }
        // Update PO status
        if (poId) {
          const { data: allLines } = await (supabase as any).from("purchase_order_lines").select("quantity,received_quantity").eq("po_id", poId);
          const allReceived = (allLines || []).every((x: any) => Number(x.received_quantity) >= Number(x.quantity));
          const anyReceived = (allLines || []).some((x: any) => Number(x.received_quantity) > 0);
          await (supabase as any).from("purchase_orders").update({ status: allReceived ? "received" : anyReceived ? "partial" : "sent" }).eq("id", poId);
        }
      }

      toast({ title: id ? "GRN updated" : "GRN created — stock updated" });
      navigate(`/grns/${grnId}`);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{id ? "Edit GRN" : "New Goods Receipt"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/grns")}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save GRN"}</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Purchase Order</Label>
            <Select value={poId || undefined} onValueChange={loadFromPo}>
              <SelectTrigger><SelectValue placeholder="Select PO (optional)" /></SelectTrigger>
              <SelectContent className="z-50 max-h-60">
                {pos.length === 0 ? (
                  <SelectItem value="none" disabled>No pending POs</SelectItem>
                ) : (
                  pos.map(p => <SelectItem key={p.id} value={p.id}>{p.po_number}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Vendor *</Label>
            <Select value={vendorId || undefined} onValueChange={setVendorId}>
              <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
              <SelectContent className="z-50 max-h-60">
                {vendors.length === 0 ? (
                  <SelectItem value="none" disabled>No vendors found</SelectItem>
                ) : (
                  vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.display_name || v.name || "Vendor"}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Warehouse</Label>
            <div className="flex gap-2">
              <Select value={warehouseId || undefined} onValueChange={setWarehouseId}>
                <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                <SelectContent className="z-50 max-h-60">
                  {warehouses.length === 0 ? (
                    <SelectItem value="none" disabled>No warehouses found</SelectItem>
                  ) : (
                    warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name} {w.is_default ? "(Default)" : ""}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAddWarehouseOpen(true)}
                title="Add new warehouse"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Branch</Label>
            <Select value={branchId || undefined} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent className="z-50 max-h-60">
                {branches.length === 0 ? (
                  <SelectItem value="none" disabled>No branches found</SelectItem>
                ) : (
                  branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} {b.is_default ? "(Default)" : ""}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>
          <div><Label>GRN #</Label><Input value={grnNumber} onChange={e => setGrnNumber(e.target.value)} /></div>
          <div><Label>GRN Date</Label><Input type="date" value={grnDate} onChange={e => setGrnDate(e.target.value)} /></div>
          <div><Label>Vehicle #</Label><Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="MH-12-AB-1234" /></div>
          <div><Label>Transporter</Label><Input value={transporter} onChange={e => setTransporter(e.target.value)} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Received Items</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setLines([...lines, emptyLine()])}><Plus className="h-4 w-4 mr-1" /> Add Line</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-[220px]">Item</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="w-28 text-center">Qty</TableHead>
                <TableHead className="w-36 text-right">Unit Cost (₹)</TableHead>
                <TableHead className="w-24 text-center">GST %</TableHead>
                <TableHead className="w-32 text-right">Total (₹)</TableHead>
                <TableHead className="w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => {
                const it = items.find(x => x.id === l.item_id);
                const q = Number(l.quantity) || 0;
                const c = Number(l.unit_cost) || 0;
                const tr = Number(l.tax_rate) || 0;
                const lineBase = q * c;
                const lineTotal = lineBase + (lineBase * (tr / 100));

                return (
                  <Fragment key={i}>
                    <TableRow className="border-b-0 hover:bg-slate-50/40">
                      <TableCell className="w-[220px] align-top pt-3">
                        <Select value={l.item_id || undefined} onValueChange={(v) => pickItem(i, v)}>
                          <SelectTrigger className="h-9 w-full bg-white"><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent className="z-50 max-h-60">
                            {items.length === 0 ? (
                              <SelectItem value="none" disabled>No items found</SelectItem>
                            ) : (
                              items.map(x => (
                                <SelectItem key={x.id} value={x.id}>
                                  {x.name} {x.sku ? `(${x.sku})` : ""}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[200px] align-top pt-3">
                        <Input
                          value={l.description}
                          onChange={e => {
                            const x = [...lines];
                            x[i].description = e.target.value;
                            setLines(x);
                          }}
                          placeholder="Description..."
                          className="h-9 bg-white"
                        />
                      </TableCell>
                      <TableCell className="w-28 align-top pt-3">
                        <Input
                          type="number"
                          placeholder="1"
                          min={0}
                          value={l.quantity}
                          onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                          onChange={e => {
                            const x = [...lines];
                            x[i].quantity = e.target.value === "" ? "" : String(Math.max(0, parseFloat(e.target.value) || 0));
                            setLines(x);
                          }}
                          className="h-9 text-center font-semibold bg-white"
                        />
                      </TableCell>
                      <TableCell className="w-36 align-top pt-3">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          min={0}
                          value={l.unit_cost}
                          onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                          onChange={e => {
                            const x = [...lines];
                            x[i].unit_cost = e.target.value === "" ? "" : String(Math.max(0, parseFloat(e.target.value) || 0));
                            setLines(x);
                          }}
                          className="h-9 text-right font-semibold bg-white"
                        />
                      </TableCell>
                      <TableCell className="w-24 align-top pt-3">
                        <Input
                          type="number"
                          placeholder="0"
                          min={0}
                          value={l.tax_rate}
                          onChange={e => {
                            const x = [...lines];
                            x[i].tax_rate = e.target.value === "" ? "" : String(Math.max(0, parseFloat(e.target.value) || 0));
                            setLines(x);
                          }}
                          className="h-9 text-center bg-white"
                        />
                      </TableCell>
                      <TableCell className="w-32 align-top pt-3 text-right">
                        <div className="h-9 flex items-center justify-end font-bold text-slate-800">
                          ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </TableCell>
                      <TableCell className="w-12 align-top pt-3 text-center">
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-red-600" onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-slate-200/80 hover:bg-transparent">
                      <TableCell colSpan={7} className="pt-0 pb-3 px-4">
                        <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-50/90 rounded-md border border-slate-200/90 text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tracking:</span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Batch #:</span>
                            <Input
                              value={l.batch_no}
                              onChange={e => { const x = [...lines]; x[i].batch_no = e.target.value; setLines(x); }}
                              placeholder={it?.track_batches ? "Batch number" : "Optional batch #"}
                              className="h-7 text-xs bg-white border-slate-200"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Serial #:</span>
                            <Input
                              value={l.serial_no}
                              onChange={e => { const x = [...lines]; x[i].serial_no = e.target.value; setLines(x); }}
                              placeholder={it?.track_serials ? "Serial number" : "Optional serial #"}
                              className="h-7 text-xs bg-white border-slate-200"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 w-52 shrink-0">
                            <span className="text-slate-600 font-medium whitespace-nowrap">Expiry:</span>
                            <Input
                              type="date"
                              value={l.expiry_date}
                              onChange={e => { const x = [...lines]; x[i].expiry_date = e.target.value; setLines(x); }}
                              className="h-7 text-xs bg-white border-slate-200"
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
          <div className="mt-6 flex justify-end">
            <div className="w-80 space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Material / Base Value:</span>
                <span className="font-semibold text-slate-800">₹{baseTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST / Tax Amount:</span>
                <span className="font-semibold text-slate-800">₹{taxTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-base text-slate-900">
                <span>Total GRN Value:</span>
                <span className="text-emerald-700">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="pt-5"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></CardContent></Card>

      <AddWarehouseDialog
        open={addWarehouseOpen}
        onOpenChange={setAddWarehouseOpen}
        onWarehouseAdded={(w) => {
          setWarehouses(prev => [...prev, w]);
          setWarehouseId(w.id);
        }}
      />
    </div>
  );
}
