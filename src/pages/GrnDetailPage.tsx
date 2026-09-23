import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, FileText } from "lucide-react";
import { format } from "date-fns";

export default function GrnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [g, setG] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase as any).from("grns").select("*, vendors(name), purchase_orders(po_number), warehouses(name)").eq("id", id).maybeSingle();
        if (error || !data) {
          const { data: rawG } = await (supabase as any).from("grns").select("*").eq("id", id).maybeSingle();
          if (rawG) {
            const [v, p, w] = await Promise.all([
              rawG.vendor_id ? (supabase as any).from("vendors").select("name").eq("id", rawG.vendor_id).maybeSingle() : { data: null },
              rawG.po_id ? (supabase as any).from("purchase_orders").select("po_number").eq("id", rawG.po_id).maybeSingle() : { data: null },
              rawG.warehouse_id ? (supabase as any).from("warehouses").select("name").eq("id", rawG.warehouse_id).maybeSingle() : { data: null },
            ]);
            setG({
              ...rawG,
              vendors: v.data,
              purchase_orders: p.data,
              warehouses: w.data,
            });
          }
        } else {
          setG(data);
        }
      } catch (err) {
        console.error("Error loading GRN details:", err);
      }
      const { data: l } = await (supabase as any).from("grn_lines").select("*, items(name)").eq("grn_id", id).order("sort_order");
      setLines(l || []);
    })();
  }, [id]);


  if (!g) return <div className="p-6 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => navigate("/grns")}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-semibold">{g.grn_number}</h1>
          <Badge>{g.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/grns/${id}/edit`)}><Pencil className="h-4 w-4 mr-1" />Edit</Button>
          <Button onClick={() => navigate(`/bills/new?grn=${id}`)}><FileText className="h-4 w-4 mr-1" />Create Bill</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><div className="text-muted-foreground">Vendor</div><div className="font-medium">{g.vendors?.name || "—"}</div></div>
          <div><div className="text-muted-foreground">PO #</div><div>{g.purchase_orders?.po_number || "—"}</div></div>
          <div><div className="text-muted-foreground">Date</div><div>{format(new Date(g.grn_date), "dd MMM yyyy")}</div></div>
          <div><div className="text-muted-foreground">Warehouse</div><div>{g.warehouses?.name || "—"}</div></div>
          <div><div className="text-muted-foreground">Vehicle</div><div>{g.vehicle_number || "—"}</div></div>
          <div><div className="text-muted-foreground">Transporter</div><div>{g.transporter || "—"}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Received Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Item</TableHead><TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Cost</TableHead>
              <TableHead>Batch</TableHead><TableHead>Serial</TableHead><TableHead>Expiry</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {lines.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.items?.name || "—"}</TableCell>
                  <TableCell>{l.description}</TableCell>
                  <TableCell className="text-right">{l.quantity}</TableCell>
                  <TableCell className="text-right">{Number(l.unit_cost).toFixed(2)}</TableCell>
                  <TableCell>{l.batch_no || "—"}</TableCell>
                  <TableCell>{l.serial_no || "—"}</TableCell>
                  <TableCell>{l.expiry_date ? format(new Date(l.expiry_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell className="text-right">{Number(l.amount).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-end">
            <div className="text-sm font-medium">
              Total Value: <span className="font-bold text-base text-emerald-700 ml-1">₹{lines.reduce((s, l) => s + Number(l.amount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

