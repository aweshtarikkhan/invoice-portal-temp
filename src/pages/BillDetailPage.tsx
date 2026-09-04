import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, ArrowLeft, Plus, Copy, MessageCircle, Printer, Download } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { postBillPaymentJournal } from "@/lib/accounting";
import { StyledInvoiceTemplate } from "@/components/invoice/StyledInvoiceTemplate";
import { calculateTaxBreakdown, stateCodeFromGstin } from "@/lib/gst";
import { getDocumentPreviewClass } from "@/lib/document-templates";
import { getWhatsappTemplate, compileWhatsappMessage, openWhatsappShare } from "@/lib/whatsapp";
import { useAutoEmailPDF } from "@/hooks/useAutoEmailPDF";
import { useCallback } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export default function BillDetailPage() {
  const org = useAppStore((s) => s.organization);
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [bill, setBill] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmt, setPayAmt] = useState("");
  const [payDate, setPayDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const load = async () => {
    const { data: b } = await (supabase as any).from("bills").select("*").eq("id", id).maybeSingle();
    if (!b) return;
    setBill(b);
    setPayAmt(String(b.balance_due));
    const [{ data: l }, { data: v }, { data: p }] = await Promise.all([
      (supabase as any).from("bill_lines").select("*, items(name, sku, unit)").eq("bill_id", id).order("sort_order"),
      (supabase as any).from("vendors").select("*").eq("id", b.vendor_id).maybeSingle(),
      (supabase as any).from("bill_payments").select("*").eq("bill_id", id).order("payment_date", { ascending: false }),
    ]);
    setLines(l || []); setVendor(v); setPayments(p || []);
  };
  useEffect(() => { load(); }, [id]);

  const recordPayment = async () => {
    const amt = Number(payAmt);
    if (!amt || amt <= 0) { toast({ title: "Enter amount", variant: "destructive" }); return; }
    if (!org?.id || !bill) return;
    const payload: any = {
      org_id: org.id, vendor_id: bill.vendor_id, bill_id: bill.id,
      payment_date: payDate, amount: amt, payment_method: payMethod, reference: payRef || null,
      branch_id: bill.branch_id,
    };
    const { data: pmt, error } = await (supabase as any).from("bill_payments").insert(payload).select().single();
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    const newPaid = Number(bill.amount_paid) + amt;
    const newDue = Math.max(0, Number(bill.total) - newPaid);
    const status = newDue <= 0 ? "paid" : "partial";
    await (supabase as any).from("bills").update({ amount_paid: newPaid, balance_due: newDue, status }).eq("id", bill.id);
    await postBillPaymentJournal(org.id, pmt.id, payDate, bill.bill_number, bill.vendor_id, amt, payMethod, bill.branch_id);
    toast({ title: "Payment recorded" });
    setPayOpen(false); setPayRef(""); load();
  };

  const statusColor: Record<string, string> = {
    draft: "bg-muted", received: "bg-blue-100 text-blue-700",
    partial: "bg-amber-100 text-amber-700", paid: "bg-emerald-100 text-emerald-700",
  };
  const invoiceRef = useRef<HTMLDivElement>(null);

  const mappedBillForTemplate = useMemo(() => {
    if (!bill) return null;
    const vendorName = vendor?.display_name || vendor?.name || (bill as any)?.vendor_name || "Vendor";
    return {
      ...bill,
      invoice_number: bill.vendor_bill_number || bill.bill_number,
      issue_date: bill.bill_date,
      total_tax: bill.tax_total || 0,
      total_discount: bill.discount_total || 0,
      adjustment: Number(bill.adjustment || 0),
      shipping_charge: 0,
      clients: {
        display_name: vendorName,
        tax_number: vendor?.gstin || (bill as any)?.vendor_gstin,
        billing_address: vendor?.billing_address || (bill as any)?.vendor_address,
        email: vendor?.email,
        phone: vendor?.phone
      }
    };
  }, [bill, vendor]);

  const isInterstate = useMemo(() => {
    if (!bill || !org) return false;
    const orgState = org.gst_number ? stateCodeFromGstin(org.gst_number) : null;
    let clientState = null;
    const vendorGstin = vendor?.gstin || (bill as any)?.vendor_gstin;
    if (vendorGstin) clientState = stateCodeFromGstin(vendorGstin);
    return Boolean(orgState && clientState && orgState !== clientState);
  }, [bill, org, vendor]);

  const enhancedLines = useMemo(() => {
    return (lines || []).map((l: any) => {
      const desc = l.description || "";
      const splitDesc = desc.split("\n");
      const itemName = l.items?.name || l.name || splitDesc[0] || "Item";
      const itemDesc = l.items?.name ? desc : (splitDesc.slice(1).join("\n") || "");
      const q = Number(l.quantity) || 0;
      const r = Number(l.rate) || 0;
      const tr = Number(l.tax_rate) || 0;
      const tax_amount = Number(l.tax_amount) || (q * r * (tr / 100));
      const amount = Number(l.amount) || (q * r + tax_amount);
      return {
        ...l,
        name: itemName,
        description: itemDesc,
        hsn_code: l.hsn || l.hsn_code || "",
        unit: l.unit || l.items?.unit || "pcs",
        quantity: q,
        rate: r,
        tax_rate: tr,
        tax_amount,
        amount,
      };
    });
  }, [lines]);

  const taxBreakdown = useMemo(() => {
    if (!bill || !org || !enhancedLines.length) return [];
    
    let breakdown = calculateTaxBreakdown(enhancedLines, [], isInterstate);
    
    // Fallback if breakdown is empty but total tax > 0
    if (breakdown.length === 0 && bill.tax_total > 0) {
      const totalTax = Number(bill.tax_total || 0);
      const subtotal = Number(bill.subtotal || 0);
      const assumedRate = subtotal > 0 ? Math.round((totalTax / subtotal) * 100) : 0;
      
      if (isInterstate) {
        breakdown = [{ id: `IGST_${assumedRate}`, name: assumedRate > 0 ? `IGST @ ${assumedRate}%` : 'IGST', rate: assumedRate, amount: totalTax }];
      } else {
        const halfRate = assumedRate / 2;
        breakdown = [
          { id: `CGST_${halfRate}`, name: halfRate > 0 ? `CGST @ ${halfRate}%` : 'CGST', rate: halfRate, amount: totalTax / 2 },
          { id: `SGST_${halfRate}`, name: halfRate > 0 ? `SGST @ ${halfRate}%` : 'SGST', rate: halfRate, amount: totalTax / 2 }
        ];
      }
    }
    
    return breakdown;
  }, [bill, enhancedLines, org, isInterstate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: (org as any)?.currency || "INR" }).format(n);

  if (!bill) return <div className="p-6">Loading...</div>;

  const generatePDFBlob = useCallback(async (): Promise<Blob | null> => {
    if (!org || !bill) return null;
    const target = invoiceRef.current?.firstElementChild as HTMLElement || invoiceRef.current;
    if (!target) return null;

    const paperSizes: Record<string, [number, number]> = {
      a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6], a5: [148, 210], a6: [105, 148], pos80: [80, 297],
    };
    const paperKey = (org as any).template_paper_size || "a4";
    const [pW, pH] = paperSizes[paperKey] || paperSizes.a4;
    const targetPxWidth = Math.round(pW * 3.779528);
    
    const canvas = await html2canvas(target, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: targetPxWidth,
      onclone: (clonedDoc) => {
        const el = (clonedDoc.querySelector('.print\\:m-0')?.firstElementChild as HTMLElement) || (clonedDoc.body.firstElementChild as HTMLElement);
        if (el) {
          el.style.width = `${targetPxWidth}px`;
          el.style.maxWidth = `${targetPxWidth}px`;
          el.style.minWidth = `${targetPxWidth}px`;
          el.style.boxShadow = "none";
          el.style.border = "none";
          el.style.borderRadius = "0";
          el.style.margin = "0";
        }
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.7);
    const imgWmm = pW;
    const imgHmm = (canvas.height * imgWmm) / canvas.width;

    if (paperKey === "pos80") {
      const pageH = imgHmm + 4;
      const pdf = new jsPDF("p", "mm", [pW, pageH]);
      pdf.addImage(imgData, "JPEG", 0, 2, pW, imgHmm);
      return pdf.output('blob');
    }

    const pdf = new jsPDF("p", "mm", [pW, pH]);
    if (imgHmm <= pH + 3) {
      pdf.addImage(imgData, "JPEG", 0, 0, pW, Math.min(imgHmm, pH));
    } else {
      let heightLeft = imgHmm;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, pW, imgHmm);
      heightLeft -= pH;
      while (heightLeft > 0) {
        position -= pH;
        pdf.addPage([pW, pH]);
        pdf.addImage(imgData, "JPEG", 0, position, pW, imgHmm);
        heightLeft -= pH;
      }
    }
    return pdf.output('blob');
  }, [bill, org]);

  const fullBillData = useMemo(() => {
    return bill && vendor ? { ...bill, vendors: vendor } : null;
  }, [bill, vendor]);

  useAutoEmailPDF({ entityType: "bill", entityData: fullBillData, generatePDFBlob });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/bills")}><ArrowLeft className="h-4 w-4 mr-1" /> Purchase Invoices</Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Button variant="outline" onClick={async () => {
            const blob = await generatePDFBlob();
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${bill.bill_number || "purchase-invoice"}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            }
          }}><Download className="h-4 w-4 mr-1" /> Download PDF</Button>
          <Button variant="outline" disabled={!(useAppStore.getState().userRole === 'admin' || useAppStore.getState().userRole === 'owner' || useAppStore.getState().userPermissions.includes('whatsapp_access'))} onClick={async () => {
            if (!org || !bill) return;
            const vendorName = vendor?.display_name || vendor?.name || "Vendor";
            const template = await getWhatsappTemplate(org.id, "bill");
            const txt = compileWhatsappMessage(template, {
              client_name: vendorName,
              document_no: bill.bill_number,
              total: fmt(Number(bill.total)),
              due_date: bill.due_date || bill.bill_date || "",
              subtotal: fmt(Number(bill.subtotal)),
              tax: fmt(Number(bill.tax_total)),
              discount: fmt(Number(bill.discount_total)),
              tds: bill.tds_amount ? fmt(Number(bill.tds_amount)) : "0.00",
              adjustment: bill.adjustment ? fmt(Number(bill.adjustment)) : "0.00",
              items: enhancedLines.map(l => `- ${l.name || 'Item'} x${l.quantity}`).join('\n'),
              portal_link: "",
              org_name: org.name
            });

            await openWhatsappShare({
              phone: vendor?.phone,
              message: txt,
              orgId: org.id
            });
          }}><MessageCircle className="h-4 w-4 mr-1 text-emerald-600" /> WhatsApp</Button>
          <Button variant="outline" onClick={() => setDuplicateDialogOpen(true)}><Copy className="h-4 w-4 mr-1" /> Duplicate</Button>
          <Button variant="outline" onClick={() => navigate(`/bills/${id}/edit`)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
          {bill.balance_due > 0 && <Button onClick={() => setPayOpen(true)}><Plus className="h-4 w-4 mr-1" /> Record Payment</Button>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge className={statusColor[bill.status]}>{bill.status}</Badge>
        <span className="text-sm text-muted-foreground">
          {vendor?.display_name || vendor?.name || "Vendor"} • Purchase Invoice Date {bill.bill_date ? format(new Date(bill.bill_date), "dd MMM yyyy") : ""}
        </span>
      </div>

      <div ref={invoiceRef}>
          {mappedBillForTemplate && (
            <div className={getDocumentPreviewClass(org?.template_style, org?.template_paper_size)}>
              <StyledInvoiceTemplate org={org} invoice={mappedBillForTemplate} lines={enhancedLines} fmt={fmt} type="bill" taxBreakdown={taxBreakdown} isInterstate={isInterstate} />
            </div>
          )}
      </div>

      {payments.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="capitalize">{p.payment_method.replace("_", " ")}</TableCell>
                    <TableCell>{p.reference || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(p.amount), (org as any)?.currency || "INR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount</Label><Input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)} /></div>
            <div><Label>Date</Label><Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} /></div>
            <div>
              <Label>Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reference</Label><Input value={payRef} onChange={e => setPayRef(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Purchase Invoice?</DialogTitle>
            <DialogDescription>
              This will create a new copy of this purchase invoice using today's date. You can review and edit it before saving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { setDuplicateDialogOpen(false); navigate(`/bills/new?duplicate=${id}`); }}>Create Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
