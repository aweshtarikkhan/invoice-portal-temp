import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Printer, FileText } from "lucide-react";

export default function DebitNoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const org = useAppStore((s) => s.organization);
  const [debitNote, setDebitNote] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data: dn } = await supabase
        .from("debit_notes" as any)
        .select("*, vendors:vendor_id(id, name, display_name, gstin, phone, email)")
        .eq("id", id)
        .single();

      if (dn) {
        setDebitNote(dn);
        const { data: l } = await supabase
          .from("debit_note_lines" as any)
          .select("*")
          .eq("debit_note_id", id)
          .order("sort_order");
        setLines(l || []);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading debit note...</div>;
  }

  if (!debitNote) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">Debit note not found.</p>
        <Button onClick={() => navigate("/debit-notes")}>Back to Debit Notes</Button>
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate("/debit-notes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debit Notes
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-border shadow-sm p-8 print:border-none print:shadow-none">
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">DEBIT NOTE</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Purchase Return Voucher</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{debitNote.debit_note_number}</div>
            <div className="text-xs text-muted-foreground">Date: {debitNote.issue_date}</div>
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              {debitNote.status?.toUpperCase() || "ISSUED"}
            </span>
          </div>
        </div>

        {/* Vendor & Company info */}
        <div className="grid grid-cols-2 gap-8 py-6 border-b text-sm">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">To Vendor:</div>
            <div className="font-bold text-base">{debitNote.vendors?.display_name || debitNote.vendors?.name}</div>
            {debitNote.vendors?.gstin && <div className="text-xs text-muted-foreground">GSTIN: {debitNote.vendors.gstin}</div>}
            {debitNote.vendors?.phone && <div className="text-xs text-muted-foreground">Phone: {debitNote.vendors.phone}</div>}
            {debitNote.vendors?.email && <div className="text-xs text-muted-foreground">Email: {debitNote.vendors.email}</div>}
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">From:</div>
            <div className="font-bold text-base">{org?.name}</div>
            {org?.gst_number && <div className="text-xs text-muted-foreground">GSTIN: {org.gst_number}</div>}
            {debitNote.reason && (
              <div className="mt-3 text-xs bg-muted/40 p-2 rounded inline-block text-left">
                <span className="font-medium">Return Reason:</span> {debitNote.reason}
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Item & Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">GST %</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{l.name}</div>
                    {l.description && <div className="text-xs text-muted-foreground">{l.description}</div>}
                  </TableCell>
                  <TableCell className="text-right font-medium">{l.quantity}</TableCell>
                  <TableCell className="text-right">{fmt(Number(l.rate || 0))}</TableCell>
                  <TableCell className="text-right">{l.tax_rate}%</TableCell>
                  <TableCell className="text-right">{fmt(Number(l.tax_amount || 0))}</TableCell>
                  <TableCell className="text-right font-semibold">{fmt(Number(l.amount || 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(Number(debitNote.subtotal || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total GST</span>
              <span>{fmt(Number(debitNote.total_tax || 0))}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg text-primary">
              <span>Total Debit Amount</span>
              <span>{fmt(Number(debitNote.total || 0))}</span>
            </div>
          </div>
        </div>

        {debitNote.notes && (
          <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
            <span className="font-semibold">Notes:</span> {debitNote.notes}
          </div>
        )}
      </Card>
    </div>
  );
}
