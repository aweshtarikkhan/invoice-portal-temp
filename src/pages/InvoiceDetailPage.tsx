import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Send, FileDown, Copy, Ban, CreditCard, Share2, Download, Printer, MessageCircle, FileMinus2, MoreHorizontal } from "lucide-react";
import { getOrCreatePortalToken, portalUrl } from "@/lib/share";
import { getWhatsappTemplate, compileWhatsappMessage, openWhatsappShare } from "@/lib/whatsapp";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDocumentPreviewClass, getPaperSizeLabel, getPrintPageCSS } from "@/lib/document-templates";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { StyledInvoiceTemplate } from "@/components/invoice/StyledInvoiceTemplate";
import { calculateTaxBreakdown, stateCodeFromGstin } from "@/lib/gst";
import { useAutoEmailPDF } from "@/hooks/useAutoEmailPDF";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0, payment_mode: "bank_transfer", reference_number: "", notes: "", payment_date: new Date().toISOString().split("T")[0],
  });
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const fetchInvoice = async () => {
    if (!id) return;
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("*, clients(display_name, email, tax_number, phone, billing_address, shipping_address)")
      .eq("id", id)
      .single();
    
    if (inv) {
      const { data: cfData } = await supabase
        .from("custom_field_values")
        .select("value, custom_field_definitions(field_name)")
        .eq("entity_id", id);
      (inv as any).custom_field_values = cfData || [];
    }
    setInvoice(inv);
    if (inv) {
      setPaymentForm((f) => ({ ...f, amount: Number(inv.balance_due) }));
    }

    const { data: lineData } = await supabase
      .from("invoice_lines")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order");
    setLines(lineData || []);

    const { data: payData } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", id)
      .order("payment_date", { ascending: false });
    setPayments(payData || []);

    if (org?.id) {
      const { data: taxData } = await supabase.from("tax_rates").select("*").eq("org_id", org.id);
      setTaxRates(taxData || []);
    }
  };

  useEffect(() => { fetchInvoice(); }, [id, org?.id]);

  const isInterstate = useMemo(() => {
    if (!invoice || !org) return false;
    const orgState = org.gst_number ? stateCodeFromGstin(org.gst_number)
      : (org.address && typeof org.address === 'object' ? (org.address as any).state : null);
    let clientState = null;
    if (invoice.clients?.tax_number) clientState = stateCodeFromGstin(invoice.clients.tax_number);
    else if (invoice.clients?.billing_address && typeof invoice.clients.billing_address === 'object') {
      clientState = (invoice.clients.billing_address as any).state;
    }
    return Boolean(orgState && clientState && orgState !== clientState);
  }, [invoice, org]);

  const taxBreakdown = useMemo(() => {
    if (!invoice || !org || !lines.length) return [];
    return calculateTaxBreakdown(lines, taxRates, isInterstate);
  }, [invoice, lines, org, taxRates, isInterstate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const handleRecordPayment = async () => {
    if (!invoice || paymentForm.amount <= 0) return;

    // Generate payment number
    const payNum = `PAY-${Date.now()}`;

    const { error } = await supabase.from("payments").insert({
      org_id: org!.id,
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      payment_number: payNum,
      payment_date: paymentForm.payment_date,
      amount: paymentForm.amount,
      currency_code: invoice.currency_code,
      payment_mode: paymentForm.payment_mode,
      reference_number: paymentForm.reference_number,
      notes: paymentForm.notes,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update invoice
    const newPaid = Number(invoice.amount_paid) + paymentForm.amount;
    const newBalance = Number(invoice.total) - newPaid;
    const newStatus = newBalance <= 0 ? "paid" : "partial";

    await supabase.from("invoices").update({
      amount_paid: newPaid,
      balance_due: Math.max(0, newBalance),
      status: newStatus,
      ...(newBalance <= 0 ? { paid_at: new Date().toISOString() } : {}),
    }).eq("id", invoice.id);

    setPaymentDialogOpen(false);
    toast({ title: "Payment recorded!" });
    if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "payment", entityId: invoice.id, action: "payment_recorded", description: `Payment of ${paymentForm.amount} recorded for ${invoice.invoice_number}` });
    fetchInvoice();
  };

  const handleVoid = async () => {
    if (!invoice) return;
    await supabase.from("invoices").update({ status: "void" }).eq("id", invoice.id);
    toast({ title: "Invoice voided" });
    if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "invoice", entityId: invoice.id, action: "void", description: `Invoice ${invoice.invoice_number} voided` });
    fetchInvoice();
  };

  const handleMarkSent = async () => {
    if (!invoice) return;
    await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice.id);
    toast({ title: "Invoice marked as sent" });
    if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "invoice", entityId: invoice.id, action: "mark_sent", description: `Invoice ${invoice.invoice_number} marked as sent` });
    fetchInvoice();
  };

  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current) return;
    const paperSizes: Record<string, [number, number]> = {
      a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6], a5: [148, 210], a6: [105, 148], pos80: [80, 297],
    };
    const paperKey = org?.template_paper_size || "a4";
    const [pW, pH] = paperSizes[paperKey] || paperSizes.a4;

    // Target width in standard pixels at 96 DPI (210mm = 794px for A4)
    const targetPxWidth = Math.round(pW * 3.779528);

    const target = (invoiceRef.current.querySelector(".invoice-printable") as HTMLElement) || invoiceRef.current;
    const canvas = await html2canvas(target, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: targetPxWidth,
      onclone: (clonedDoc) => {
        const el = (clonedDoc.querySelector(".invoice-printable") as HTMLElement) || (clonedDoc.body.firstElementChild as HTMLElement);
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
      pdf.save(`${invoice?.invoice_number || "invoice"}.pdf`);
      return;
    }

    const pdf = new jsPDF("p", "mm", [pW, pH]);

    // If total invoice content fits on one page (with 3mm tolerance):
    if (imgHmm <= pH + 3) {
      pdf.addImage(imgData, "JPEG", 0, 0, pW, Math.min(imgHmm, pH));
    } else {
      // Clean multi-page handling
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

    pdf.save(`${invoice?.invoice_number || "invoice"}.pdf`);
  }, [invoice, org]);

  const generatePDFBlob = useCallback(async (): Promise<Blob | null> => {
    if (!invoiceRef.current || !invoice || !org) return null;

    const paperSizes: Record<string, [number, number]> = {
      a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6], a5: [148, 210], a6: [105, 148], pos80: [80, 297],
    };
    const paperKey = (org as any).template_paper_size || "a4";
    const [pW, pH] = paperSizes[paperKey] || paperSizes.a4;
    const targetPxWidth = Math.round(pW * 3.779528);

    const target = (invoiceRef.current.querySelector(".invoice-printable") as HTMLElement) || invoiceRef.current;
    
    const canvas = await html2canvas(target, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: targetPxWidth,
      onclone: (clonedDoc) => {
        const el = (clonedDoc.querySelector(".invoice-printable") as HTMLElement) || (clonedDoc.body.firstElementChild as HTMLElement);
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
  }, [invoice, org]);

  useAutoEmailPDF({ entityType: "invoice", entityData: invoice, generatePDFBlob });

  if (!invoice) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  const snapshot = (invoice.metadata as any) || {};
  const effectiveOrg = {
    ...org,
    template_style: snapshot.template_style || org?.template_style,
    template_accent_color: snapshot.template_accent_color || org?.template_accent_color,
    template_font: snapshot.template_font || org?.template_font,
    template_paper_size: snapshot.template_paper_size || org?.template_paper_size,
    gst_number: snapshot.has_gst !== undefined ? (snapshot.has_gst ? org?.gst_number : "") : org?.gst_number,
    custom_fields: invoice.custom_field_values?.map((cf: any) => ({ name: cf.custom_field_definitions?.field_name, value: cf.value })) || [],
  };

  const printCSS = getPrintPageCSS(effectiveOrg.template_paper_size);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Inject print styles for correct paper size */}
      <style dangerouslySetInnerHTML={{ __html: printCSS }} />

      <PageHeader title={`Invoice ${invoice.invoice_number}`}>
        <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${id}/edit`)}>
          <Edit className="mr-1 h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="mr-1 h-4 w-4" /> Download PDF
        </Button>
        {invoice.status !== "void" && invoice.status !== "paid" && (
          <Button size="sm" onClick={() => setPaymentDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <CreditCard className="mr-1 h-4 w-4" /> Record Payment
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async () => {
              const token = await getOrCreatePortalToken(org!.id, "invoice", id!);
              if (token) {
                await navigator.clipboard.writeText(portalUrl(token));
                toast({ title: "Portal link copied!" });
              }
            }}>
              <Share2 className="mr-2 h-4 w-4" /> Share Link
            </DropdownMenuItem>
            <DropdownMenuItem 
              disabled={!(useAppStore.getState().userRole === 'admin' || useAppStore.getState().userRole === 'owner' || useAppStore.getState().userPermissions.includes('whatsapp_access'))}
              onClick={async () => {
              if (!org || !invoice || !invoice.clients) return;
              const token = await getOrCreatePortalToken(org.id, "invoice", invoice.id);
              
              const template = await getWhatsappTemplate(org.id, "invoice");
              const txt = compileWhatsappMessage(template, {
                client_name: invoice.clients.display_name,
                document_no: invoice.invoice_number,
                total: fmt(Number(invoice.total)),
                due_date: invoice.due_date || "",
                subtotal: fmt(Number(invoice.subtotal)),
                tax: fmt(Number(invoice.tax_total)),
                discount: fmt(Number(invoice.discount_total)),
                tds: invoice.tds_amount ? fmt(Number(invoice.tds_amount)) : "0.00",
                adjustment: invoice.adjustment ? fmt(Number(invoice.adjustment)) : "0.00",
                items: lines.map(l => `- ${l.items?.name || 'Item'} x${l.quantity}`).join('\n'),
                portal_link: token ? portalUrl(token) : "",
                org_name: org.name
              });

              await openWhatsappShare({
                phone: invoice.clients.phone,
                message: txt,
                orgId: org.id
              });
            }}>
              <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> Send WhatsApp Text
            </DropdownMenuItem>
            
            {invoice.status === "draft" && (
              <DropdownMenuItem onClick={handleMarkSent}>
                <Send className="mr-2 h-4 w-4" /> Mark as Sent
              </DropdownMenuItem>
            )}
            
            {invoice.status !== "void" && (
              <DropdownMenuItem onClick={() => navigate(`/credit-notes/new?invoice_id=${invoice.id}&client_id=${invoice.client_id}`)}>
                <FileMinus2 className="mr-2 h-4 w-4" /> Credit Note
              </DropdownMenuItem>
            )}

            {invoice.status !== "void" && invoice.status !== "paid" && (
              <DropdownMenuItem onClick={handleVoid} className="text-red-600 focus:text-red-700">
                <Ban className="mr-2 h-4 w-4" /> Void
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {/* Status + Summary */}
      <div className="flex items-center gap-4">
        <StatusBadge status={invoice.status} />
        <span className="text-sm text-muted-foreground">
          {(invoice.clients as any)?.display_name} • Due {invoice.due_date}
        </span>
      </div>

      {/* Phase 5 — compliance badges */}
      {((invoice as any).irn || (invoice as any).eway_bill_no) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {(invoice as any).irn && (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium">IRN</div>
              <div className="font-mono break-all">{(invoice as any).irn}</div>
              {(invoice as any).ack_no && (
                <div className="text-muted-foreground">Ack {(invoice as any).ack_no} · {(invoice as any).ack_date ? new Date((invoice as any).ack_date).toLocaleDateString() : ""}</div>
              )}
            </div>
          )}
          {(invoice as any).eway_bill_no && (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <div className="font-medium">E-way Bill</div>
              <div className="font-mono">{(invoice as any).eway_bill_no}</div>
              <div className="text-muted-foreground">
                {(invoice as any).eway_vehicle_no && `Vehicle ${(invoice as any).eway_vehicle_no} · `}
                {(invoice as any).eway_transport_mode || ""}
                {(invoice as any).eway_distance_km && ` · ${(invoice as any).eway_distance_km} km`}
                {(invoice as any).eway_valid_until && ` · valid till ${new Date((invoice as any).eway_valid_until).toLocaleDateString()}`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoice Preview */}
      <div ref={invoiceRef}>
        <div className="bg-muted p-4 sm:p-8 overflow-auto border-y flex justify-center">
          <div className={getDocumentPreviewClass(effectiveOrg.template_style, effectiveOrg.template_paper_size)}>
            <StyledInvoiceTemplate org={effectiveOrg} invoice={invoice} lines={lines} fmt={fmt} type="invoice" taxBreakdown={taxBreakdown} isInterstate={isInterstate} />
          </div>
        </div>
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell>{p.payment_number}</TableCell>
                    <TableCell className="capitalize">{p.payment_mode.replace("_", " ")}</TableCell>
                    <TableCell className="text-right">{fmt(Number(p.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentForm.payment_mode} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Invoice?</DialogTitle>
            <DialogDescription>
              This will create a new copy of this invoice using today's date. You can review and edit it before saving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { setDuplicateDialogOpen(false); navigate(`/invoices/new?duplicate=${id}`); }}>Create Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
