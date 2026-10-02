import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { restoreInvoiceStock } from "@/lib/stock";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Edit, Send, FileDown, Copy, Ban, CreditCard, Share2, Download, Printer, MessageCircle, FileMinus2, MoreHorizontal, Mail, Loader2, ArrowLeft, Lock, Wallet, Trash2 } from "lucide-react";
import { deleteSinglePayment, deleteInvoiceRecord, cancelVoidInvoiceRecord } from "@/lib/invoice-actions";
import { getWhatsappTemplate, compileWhatsappMessage, openWhatsappShare } from "@/lib/whatsapp";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getDocumentPreviewClass, getPaperSizeLabel, getPrintPageCSS } from "@/lib/document-templates";
import { QRCodeSVG } from "qrcode.react";
import { recordPaymentBankingTransaction, getOrCreateCashAccount } from "@/lib/banking-sync";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { StyledInvoiceTemplate } from "@/components/invoice/StyledInvoiceTemplate";
import { calculateTaxBreakdown, stateCodeFromGstin } from "@/lib/gst";
import { useAutoEmailPDF } from "@/hooks/useAutoEmailPDF";
import { buildBrandedEmailHtml } from "@/lib/brand-email-template";
import { getOrCreatePortalToken, portalUrl } from "@/lib/share";
import { useSubscription } from "@/hooks/use-subscription";
import { canSendDirectEmailOrWhatsApp, normalizePlanKey } from "@/lib/subscription";
import { PlanSelectorModal } from "@/components/shared/PlanSelectorModal";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const org = useAppStore((s) => s.organization);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscriptionPlan } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeOrgPlans, setActiveOrgPlans] = useState<string[]>([]);
  const plan = normalizePlanKey(subscriptionPlan);
  const canSend = canSendDirectEmailOrWhatsApp(plan, activeOrgPlans);

  useEffect(() => {
    if (!org?.id) return;
    const fetchOrgSub = async () => {
      try {
        const { data: subData } = await supabase.rpc("get_my_org_subscription", { p_org_id: org.id });
        if (subData?.all_plans && Array.isArray(subData.all_plans)) {
          setActiveOrgPlans(subData.all_plans);
        }
      } catch (e) {
        console.error("Error fetching sub in invoice detail:", e);
      }
    };
    fetchOrgSub();
  }, [org?.id]);

  const [invoice, setInvoice] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [taxRates, setTaxRates] = useState<any[]>([]);
  const [clientAvailableAdvance, setClientAvailableAdvance] = useState(0);
  const [clientAdvances, setClientAdvances] = useState<any[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0, payment_mode: "bank_transfer", reference_number: "", notes: "", payment_date: new Date().toISOString().split("T")[0],
  });
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("");

  // Delete payment states
  const [paymentToDelete, setPaymentToDelete] = useState<any>(null);
  const [deletePaymentDialogOpen, setDeletePaymentDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // Delete invoice states
  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState(false);

  // Void invoice states
  const [voidInvoiceDialogOpen, setVoidInvoiceDialogOpen] = useState(false);
  const [voidingInvoice, setVoidingInvoice] = useState(false);

  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("bank_accounts")
        .select("*")
        .eq("org_id", org.id)
        .eq("is_active", true)
        .order("name");
      const list = data || [];
      setBankAccounts(list);
      if (list.length > 0 && !selectedBankAccountId) {
        const defaultAcct = list.find((a: any) => paymentForm.payment_mode === "cash" ? a.account_type === "cash" : a.account_type !== "cash") || list[0];
        if (defaultAcct) setSelectedBankAccountId(defaultAcct.id);
      }
    })();
  }, [org?.id]);

  const selectedAccount = useMemo(() => {
    return bankAccounts.find((b) => b.id === selectedBankAccountId);
  }, [bankAccounts, selectedBankAccountId]);

  const handlePaymentModeChange = async (mode: string) => {
    setPaymentForm(prev => ({ ...prev, payment_mode: mode }));
    if (mode === "cash") {
      let cashAcc = bankAccounts.find((a) => a.account_type === "cash");
      if (!cashAcc && org?.id) {
        cashAcc = await getOrCreateCashAccount(org.id, org.currency_code || "INR");
        if (cashAcc) {
          setBankAccounts((prev) => [cashAcc, ...prev.filter((a) => a.id !== cashAcc.id)]);
        }
      }
      if (cashAcc) {
        setSelectedBankAccountId(cashAcc.id);
      }
    } else {
      const current = bankAccounts.find((a) => a.id === selectedBankAccountId);
      if (current?.account_type === "cash") {
        const bankAcc = bankAccounts.find((a) => a.account_type !== "cash");
        if (bankAcc) {
          setSelectedBankAccountId(bankAcc.id);
        }
      }
    }
  };

  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [invoiceOrg, setInvoiceOrg] = useState<any>(null);
  const [dataReady, setDataReady] = useState(false);

  const fetchInvoice = async () => {
    if (!id) return;
    setDataReady(false);
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("*, clients(display_name, email, tax_number, phone, billing_address, shipping_address)")
      .eq("id", id)
      .single();
    
    if (inv) {
      const [cfRes, lineRes, payRes, orgRes, clientAdvRes, clientAppliedRes] = await Promise.all([
        supabase.from("custom_field_values").select("value, custom_field_definitions(field_name)").eq("entity_id", id),
        supabase.from("invoice_lines").select("*, tax_rates(id, name, rate), items(id, name, hsn_code, unit)").eq("invoice_id", id).order("sort_order"),
        supabase.from("payments").select("*").eq("invoice_id", id).order("payment_date", { ascending: false }),
        inv.org_id ? supabase.from("organizations").select("*").eq("id", inv.org_id).maybeSingle() : Promise.resolve({ data: null }),
        inv.client_id ? supabase.from("payments").select("*").eq("org_id", inv.org_id || org?.id).eq("client_id", inv.client_id).is("invoice_id", null).order("payment_date", { ascending: true }) : Promise.resolve({ data: [] }),
        inv.client_id ? supabase.from("payments").select("amount, reference_number").eq("org_id", inv.org_id || org?.id).eq("client_id", inv.client_id).eq("payment_mode", "advance_credit") : Promise.resolve({ data: [] }),
      ]);

      (inv as any).custom_field_values = cfRes.data || [];
      const loadedLines = lineRes.data || [];
      setLines(loadedLines);
      setPayments(payRes.data || []);
      if (orgRes.data) {
        setInvoiceOrg(orgRes.data);
      }

      // Compute client available advance credit
      const usedMap: Record<string, number> = {};
      ((clientAppliedRes as any).data || []).forEach((p: any) => {
        if (p.reference_number) {
          const ref = p.reference_number.trim();
          usedMap[ref] = (usedMap[ref] || 0) + Number(p.amount);
        }
      });
      let totalClientAdv = 0;
      const advList: any[] = [];
      ((clientAdvRes as any).data || []).forEach((adv: any) => {
        const ref = (adv.payment_number || "").trim();
        const used = usedMap[ref] || 0;
        const remaining = Math.max(0, Number(adv.amount) - used);
        if (remaining > 0.001) {
          advList.push({ ...adv, availableAmount: remaining });
          totalClientAdv += remaining;
        }
      });
      setClientAvailableAdvance(totalClientAdv);
      setClientAdvances(advList);

      setPaymentForm((f) => ({ ...f, amount: Number(inv.balance_due) }));
      setInvoice(inv);
      setDataReady(true);

      const targetOrgId = inv.org_id || org?.id;
      if (targetOrgId) {
        const { data: taxData } = await supabase.from("tax_rates").select("*").eq("org_id", targetOrgId);
        setTaxRates(taxData || []);
      }
    }
  };

  useEffect(() => { fetchInvoice(); }, [id, org?.id]);

  const activeOrg = invoiceOrg || org;

  const isInterstate = useMemo(() => {
    if (!invoice || !activeOrg) return false;
    const orgState = activeOrg.gst_number ? stateCodeFromGstin(activeOrg.gst_number)
      : (activeOrg.address && typeof activeOrg.address === 'object' ? (activeOrg.address as any).state : null);
    let clientState = null;
    if (invoice.clients?.tax_number) clientState = stateCodeFromGstin(invoice.clients.tax_number);
    else if (invoice.clients?.billing_address && typeof invoice.clients.billing_address === 'object') {
      clientState = (invoice.clients.billing_address as any).state;
    }
    return Boolean(orgState && clientState && orgState !== clientState);
  }, [invoice, activeOrg]);

  const taxBreakdown = useMemo(() => {
    if (!invoice || !activeOrg || !lines.length) return [];
    return calculateTaxBreakdown(lines, taxRates, isInterstate);
  }, [invoice, lines, activeOrg, taxRates, isInterstate]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

  const handleQuickSettleWithAdvance = async () => {
    if (!invoice || !org || clientAvailableAdvance <= 0.001) return;
    const invBalance = Number(invoice.balance_due);
    if (invBalance <= 0.001) return;

    const toApply = Math.min(clientAvailableAdvance, invBalance);
    const prefix = org.payment_prefix || "PAY";

    try {
      let portionLeft = toApply;
      let remainingAdvList = [...clientAdvances].filter(a => a.availableAmount > 0.001);

      while (portionLeft > 0.001 && remainingAdvList.length > 0) {
        const curAdv = remainingAdvList[0];
        const take = Math.min(curAdv.availableAmount, portionLeft);
        portionLeft -= take;
        curAdv.availableAmount -= take;
        if (curAdv.availableAmount <= 0.001) remainingAdvList.shift();

        const payNum = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { error: advErr } = await supabase.from("payments").insert({
          org_id: org.id,
          client_id: invoice.client_id,
          invoice_id: invoice.id,
          payment_number: payNum,
          amount: take,
          payment_date: new Date().toISOString().split("T")[0],
          payment_mode: "advance_credit",
          bank_account_id: null,
          reference_number: curAdv.payment_number,
          notes: `Adjusted from Advance Payment ${curAdv.payment_number} for invoice ${invoice.invoice_number}`,
          currency_code: invoice.currency_code,
        });

        if (advErr) throw advErr;
      }

      const newBalance = Math.max(0, invBalance - toApply);
      const newPaid = Number(invoice.total) - newBalance;
      const newStatus = newBalance <= 0.001 ? "paid" : "partial";

      await supabase.from("invoices").update({
        amount_paid: newPaid,
        balance_due: newBalance,
        status: newStatus,
        ...(newBalance <= 0.001 ? { paid_at: new Date().toISOString() } : {}),
      }).eq("id", invoice.id);

      if (user) {
        await logAudit({
          orgId: org.id,
          userId: user.id,
          entityType: "payment",
          entityId: invoice.id,
          action: "payment_advance_adjusted",
          description: `Adjusted ${fmt(toApply)} from Advance Credit against invoice ${invoice.invoice_number}`,
        });
      }

      toast({
        title: "Advance Adjusted Successfully! 💳",
        description: `Applied ${fmt(toApply)} advance credit to invoice ${invoice.invoice_number}.${newBalance <= 0.001 ? " Invoice is now FULLY PAID." : ` Remaining due: ${fmt(newBalance)}`}`,
      });

      fetchInvoice();
    } catch (err: any) {
      toast({ title: "Failed to adjust advance", description: err.message, variant: "destructive" });
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice || paymentForm.amount <= 0) return;

    const invBalance = Number(invoice.balance_due);
    const isAdvCredit = paymentForm.payment_mode === "advance_credit";

    if (isAdvCredit) {
      // Advance credit cannot exceed client's available advance
      const toApply = Math.min(paymentForm.amount, clientAvailableAdvance, invBalance);
      if (toApply <= 0) {
        toast({ title: "No advance available", description: "This client does not have available advance credit.", variant: "destructive" });
        return;
      }

      let portionLeft = toApply;
      let remainingAdvList = [...clientAdvances].filter(a => a.availableAmount > 0.001);

      while (portionLeft > 0.001 && remainingAdvList.length > 0) {
        const curAdv = remainingAdvList[0];
        const take = Math.min(curAdv.availableAmount, portionLeft);
        portionLeft -= take;
        curAdv.availableAmount -= take;
        if (curAdv.availableAmount <= 0.001) remainingAdvList.shift();

        const payNum = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { error: advErr } = await supabase.from("payments").insert({
          org_id: org!.id,
          client_id: invoice.client_id,
          invoice_id: invoice.id,
          payment_number: payNum,
          amount: take,
          payment_date: paymentForm.payment_date,
          payment_mode: "advance_credit",
          bank_account_id: null,
          reference_number: curAdv.payment_number,
          notes: `Adjusted from Advance Payment ${curAdv.payment_number} for invoice ${invoice.invoice_number}`,
          currency_code: invoice.currency_code,
        });

        if (advErr) {
          toast({ title: "Error", description: advErr.message, variant: "destructive" });
          return;
        }
      }

      const newBalance = Math.max(0, invBalance - toApply);
      const newPaid = Number(invoice.total) - newBalance;
      const newStatus = newBalance <= 0.001 ? "paid" : "partial";

      await supabase.from("invoices").update({
        amount_paid: newPaid,
        balance_due: newBalance,
        status: newStatus,
        ...(newBalance <= 0.001 ? { paid_at: new Date().toISOString() } : {}),
      }).eq("id", invoice.id);

      setPaymentDialogOpen(false);
      toast({ title: "Payment recorded via Advance Credit!" });
      if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "payment", entityId: invoice.id, action: "payment_advance_adjusted", description: `Adjusted ${fmt(toApply)} advance credit for ${invoice.invoice_number}` });
      fetchInvoice();
      return;
    }

    // Regular Cash/Bank/Online Payment:
    // If overpaying, split into invoice payment + excess advance credit
    const isOverpaying = paymentForm.amount > invBalance;
    const invPortion = isOverpaying ? invBalance : paymentForm.amount;
    const excessPortion = isOverpaying ? paymentForm.amount - invBalance : 0;

    const payNum = `PAY-${Date.now()}`;
    const { data: insertedPay, error } = await supabase.from("payments").insert({
      org_id: org!.id,
      client_id: invoice.client_id,
      invoice_id: invoice.id,
      payment_number: payNum,
      payment_date: paymentForm.payment_date,
      amount: invPortion,
      currency_code: invoice.currency_code,
      payment_mode: paymentForm.payment_mode,
      bank_account_id: selectedBankAccountId || null,
      reference_number: paymentForm.reference_number || null,
      notes: paymentForm.notes || null,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // If there is excess payment, record it directly as customer advance credit!
    if (excessPortion > 0.001) {
      const advPayNum = `PAY-${Date.now() + 1}`;
      await supabase.from("payments").insert({
        org_id: org!.id,
        client_id: invoice.client_id,
        invoice_id: null, // Unallocated customer advance
        payment_number: advPayNum,
        payment_date: paymentForm.payment_date,
        amount: excessPortion,
        currency_code: invoice.currency_code,
        payment_mode: paymentForm.payment_mode,
        bank_account_id: selectedBankAccountId || null,
        reference_number: paymentForm.reference_number || null,
        notes: `Customer Advance Credit / Excess payment over invoice ${invoice.invoice_number} (Total paid: ${fmt(paymentForm.amount)}, Invoice settled: ${fmt(invPortion)}, Advance credited: ${fmt(excessPortion)})`,
      });
    }

    if (selectedBankAccountId) {
      await recordPaymentBankingTransaction({
        orgId: org!.id,
        bankAccountId: selectedBankAccountId,
        amount: paymentForm.amount, // Full deposit to bank account
        paymentDate: paymentForm.payment_date,
        invoiceNumber: invoice.invoice_number,
        clientName: (invoice.clients as any)?.display_name,
        referenceNumber: paymentForm.reference_number,
        paymentId: insertedPay?.id || payNum,
        paymentNumber: payNum,
        notes: isOverpaying
          ? `Invoice payment ${fmt(invPortion)} + Excess advance credit ${fmt(excessPortion)}`
          : paymentForm.notes,
      });
    }

    // Update invoice
    const newPaid = Number(invoice.amount_paid) + invPortion;
    const newBalance = Math.max(0, invBalance - invPortion);
    const newStatus = newBalance <= 0.001 ? "paid" : "partial";

    await supabase.from("invoices").update({
      amount_paid: newPaid,
      balance_due: newBalance,
      status: newStatus,
      ...(newBalance <= 0.001 ? { paid_at: new Date().toISOString() } : {}),
    }).eq("id", invoice.id);

    setPaymentDialogOpen(false);
    toast({
      title: "Payment recorded!",
      description: isOverpaying
        ? `Invoice settled with ${fmt(invPortion)}. Excess ${fmt(excessPortion)} saved as Client Advance Credit for future invoices.`
        : `Payment of ${fmt(invPortion)} recorded for ${invoice.invoice_number}.`,
    });

    if (org && user) {
      await logAudit({
        orgId: org.id,
        userId: user.id,
        entityType: "payment",
        entityId: invoice.id,
        action: "payment_recorded",
        description: `Payment of ${fmt(paymentForm.amount)} recorded for ${invoice.invoice_number}${isOverpaying ? ` (Excess ${fmt(excessPortion)} saved as customer advance)` : ""}`,
      });
    }

    fetchInvoice();
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setDeletingPayment(true);
    try {
      const res = await deleteSinglePayment(paymentToDelete.id);
      if (!res.success) {
        toast({ title: "Error", description: res.error || "Failed to delete payment", variant: "destructive" });
      } else {
        toast({
          title: "Payment Deleted",
          description: `Payment ${paymentToDelete.payment_number || ""} deleted successfully. Invoice balance and bank account updated.`,
        });
        setDeletePaymentDialogOpen(false);
        setPaymentToDelete(null);
        await fetchInvoice();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingPayment(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoice || !org) return;
    setDeletingInvoice(true);
    try {
      const res = await deleteInvoiceRecord(invoice.id, org.id, user?.id);
      if (!res.success) {
        toast({ title: "Error", description: res.error || "Failed to delete invoice", variant: "destructive" });
      } else {
        toast({
          title: "Invoice Deleted",
          description: `Invoice ${invoice.invoice_number} has been permanently deleted.${res.restoredCount > 0 ? ` ${res.restoredCount} item(s) restocked to inventory.` : ""}`,
        });
        setDeleteInvoiceDialogOpen(false);
        navigate("/invoices");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeletingInvoice(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!invoice || !org) return;
    setVoidingInvoice(true);
    try {
      const res = await cancelVoidInvoiceRecord(invoice.id, org.id, user?.id);
      if (!res.success) {
        toast({ title: "Error", description: res.error || "Failed to void invoice", variant: "destructive" });
      } else {
        toast({
          title: "Invoice Cancelled / Voided",
          description: res.restoredCount > 0
            ? `${res.restoredCount} item(s) restored to inventory.`
            : "Invoice has been marked as void.",
        });
        setVoidInvoiceDialogOpen(false);
        await fetchInvoice();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setVoidingInvoice(false);
    }
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

    if (lines && lines.length > 0) {
      let attempts = 0;
      while (attempts < 10 && !invoiceRef.current.querySelector("tbody tr")) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
    }

    const paperSizes: Record<string, [number, number]> = {
      a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6], a5: [148, 210], a6: [105, 148], pos80: [80, 297],
    };
    const paperKey = activeOrg?.template_paper_size || "a4";
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
  }, [invoice, activeOrg, lines]);

  const generatePDFBlob = useCallback(async (): Promise<Blob | null> => {
    if (!invoiceRef.current || !invoice || !activeOrg) return null;

    if (lines && lines.length > 0) {
      let attempts = 0;
      while (attempts < 10 && !invoiceRef.current.querySelector("tbody tr")) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
    }

    const paperSizes: Record<string, [number, number]> = {
      a4: [210, 297], letter: [215.9, 279.4], legal: [215.9, 355.6], a5: [148, 210], a6: [105, 148], pos80: [80, 297],
    };
    const paperKey = (activeOrg as any).template_paper_size || "a4";
    const [pW, pH] = paperSizes[paperKey] || paperSizes.a4;
    const targetPxWidth = Math.round(pW * 3.779528);

    const target = (invoiceRef.current.querySelector(".invoice-printable") as HTMLElement) || invoiceRef.current;
    
    const canvas = await html2canvas(target, {
      scale: 1,
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
  }, [invoice, activeOrg, lines]);

  useAutoEmailPDF({ entityType: "invoice", entityData: invoice, lines, isDataReady: dataReady, generatePDFBlob });

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    if (!canSend) {
      toast({
        title: "Feature Locked 🔒",
        description: "Direct document emailing is a premium feature. Please upgrade to Business Suite or Business Integration to send directly via Email.",
        variant: "destructive"
      });
      setShowUpgradeModal(true);
      return;
    }
    if (!invoice || !activeOrg) return;
    const recipientEmail = invoice.clients?.email;
    if (!recipientEmail) {
      toast({
        title: "No email address",
        description: "This client does not have an email address specified. Please edit the client to add an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    toast({ title: "Generating invoice PDF for email..." });

    try {
      const pdfBlob = await generatePDFBlob();
      if (!pdfBlob) throw new Error("Could not generate invoice PDF");

      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(pdfBlob);
        reader.onloadend = () => {
          resolve((reader.result as string).split(",")[1]);
        };
      });

      let pLink = "";
      const token = await getOrCreatePortalToken(activeOrg.id, "invoice", invoice.id);
      if (token) pLink = portalUrl(token);

      const snapshot = (invoice?.metadata as any) || {};
      const hasGst = snapshot.has_gst !== undefined
        ? Boolean(snapshot.has_gst)
        : Boolean((activeOrg?.gst_number || activeOrg?.tax_number)?.trim() || activeOrg?.gst_enabled);

      const docTitle = hasGst ? "Tax Invoice" : "Invoice";
      const subject = `${docTitle} #${invoice.invoice_number} from ${activeOrg.name || "Aassay Biz"}`;
      const details: Array<{ label: string; value: string; isHighlight?: boolean }> = [
        { label: "Invoice Number", value: invoice.invoice_number },
        { label: "Invoice Date", value: invoice.date || new Date().toISOString().split("T")[0] },
      ];
      if (invoice.due_date) {
        details.push({ label: "Due Date", value: invoice.due_date, isHighlight: true });
      }
      if (invoice.balance_due !== undefined && Number(invoice.balance_due) < Number(invoice.total)) {
        details.push({ label: "Balance Due", value: fmt(Number(invoice.balance_due)), isHighlight: true });
      }

      const html = buildBrandedEmailHtml({
        logoUrl: activeOrg.logo_url || "https://aassaybiz.com/logo.png",
        companyName: activeOrg.name || "Aassay Biz",
        companyEmail: activeOrg.email || "support@aassaybiz.com",
        badgeText: hasGst ? "TAX INVOICE" : "INVOICE",
        title: `${docTitle} #${invoice.invoice_number}`,
        subtitle: `Issued by ${activeOrg.name || "Aassay Biz"}`,
        recipientName: invoice.clients?.display_name || "Valued Customer",
        introText: `Thank you for your business. Please find below the details of your invoice along with the attached official PDF document:`,
        amountLabel: "Total Amount Due",
        amountValue: fmt(Number(invoice.total)),
        details,
        actionButton: pLink ? { label: "View & Pay Invoice Online", url: pLink } : undefined,
        attachmentNote: `${hasGst ? "Official GST Tax Invoice" : "Official Invoice"} (${invoice.invoice_number}.pdf) is attached to this email.`,
      });

      const { data, error } = await supabase.functions.invoke("send-custom-email", {
        body: {
          to: recipientEmail,
          subject,
          html,
          orgId: activeOrg.id,
          attachments: [
            {
              filename: `${invoice.invoice_number}.pdf`,
              content: base64data,
              content_type: "application/pdf",
            },
          ],
        },
      });

      if (error || data?.error) {
        if (error?.message?.includes("Failed to send a request")) {
          toast({
            title: "Email Queued ✉️",
            description: `Invoice PDF is being sent to ${recipientEmail} and will arrive shortly.`,
          });
        } else {
          throw new Error(error?.message || data?.error || "Failed to dispatch email");
        }
      } else {
        toast({
          title: "Email Sent Successfully! ✉️",
          description: `Invoice PDF was successfully sent to ${recipientEmail}.`,
        });
      }

      if (invoice.status === "draft") {
        await supabase.from("invoices").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", invoice.id);
        fetchInvoice();
      }

    } catch (err: any) {
      toast({
        title: "Failed to send email",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!invoice) {
    return <div className="p-6 text-center text-muted-foreground">Loading...</div>;
  }

  const snapshot = (invoice.metadata as any) || {};
  const hasGst = snapshot.has_gst !== undefined
    ? Boolean(snapshot.has_gst)
    : Boolean((activeOrg?.gst_number || activeOrg?.tax_number)?.trim() || activeOrg?.gst_enabled);

  const effectiveOrg = {
    ...activeOrg,
    template_style: snapshot.template_style || activeOrg?.template_style,
    template_accent_color: snapshot.template_accent_color || activeOrg?.template_accent_color,
    template_font: snapshot.template_font || activeOrg?.template_font,
    template_paper_size: snapshot.template_paper_size || activeOrg?.template_paper_size,
    gst_number: hasGst ? (activeOrg?.gst_number || activeOrg?.tax_number || "") : "",
    gst_enabled: hasGst,
    custom_fields: invoice.custom_field_values?.map((cf: any) => ({ name: cf.custom_field_definitions?.field_name, value: cf.value })) || [],
  };

  const printCSS = getPrintPageCSS(effectiveOrg.template_paper_size);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Inject print styles for correct paper size */}
      <style dangerouslySetInnerHTML={{ __html: printCSS }} />

      <PageHeader title={`Invoice ${invoice.invoice_number}`}>
        <Button variant="outline" size="sm" onClick={() => navigate("/invoices")}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${id}/edit`)}>
          <Edit className="mr-1 h-4 w-4" /> Edit
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
          <Download className="mr-1 h-4 w-4" /> Download PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={isSendingEmail} className="text-blue-600 hover:text-blue-700">
          {isSendingEmail ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Mail className="mr-1 h-4 w-4" />}
          {isSendingEmail ? "Sending..." : "Email Invoice"}
          {!canSend && <Lock className="ml-1 h-3.5 w-3.5 text-amber-500" />}
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
            <DropdownMenuItem onClick={handleSendEmail} disabled={isSendingEmail}>
              <Mail className="mr-2 h-4 w-4 text-blue-600" /> Email PDF to Client
              {!canSend && <Lock className="ml-auto h-3.5 w-3.5 text-amber-500" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
              <Copy className="mr-2 h-4 w-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </DropdownMenuItem>

            <DropdownMenuItem 
              disabled={!(useAppStore.getState().userRole === 'admin' || useAppStore.getState().userRole === 'owner' || useAppStore.getState().userPermissions.includes('whatsapp_access'))}
              onClick={async () => {
              if (!canSend) {
                toast({
                  title: "Feature Locked 🔒",
                  description: "Sending documents via WhatsApp is a premium feature. Please upgrade to Business Suite or Business Integration to send directly via WhatsApp.",
                  variant: "destructive"
                });
                setShowUpgradeModal(true);
                return;
              }
              if (!activeOrg || !invoice || !invoice.clients) return;
              const token = await getOrCreatePortalToken(activeOrg.id, "invoice", invoice.id);
              
              const template = await getWhatsappTemplate(activeOrg.id, "invoice");
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
                org_name: activeOrg.name
              });

              await openWhatsappShare({
                phone: invoice.clients.phone,
                message: txt,
                orgId: activeOrg.id
              });
            }}>
              <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" /> Send WhatsApp Text
              {!canSend && <Lock className="ml-auto h-3.5 w-3.5 text-amber-500" />}
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

            {invoice.status !== "void" && (
              <DropdownMenuItem onClick={() => setVoidInvoiceDialogOpen(true)} className="text-amber-600 focus:text-amber-700">
                <Ban className="mr-2 h-4 w-4" /> Cancel / Void Invoice
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => setDeleteInvoiceDialogOpen(true)} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Invoice
            </DropdownMenuItem>
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

      {/* Available Advance Credit Alert Banner */}
      {clientAvailableAdvance > 0.001 && Number(invoice.balance_due) > 0.001 && (
        <div className="p-4 rounded-xl border-2 border-[#e77817]/40 dark:border-[#e77817]/50 bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-blue-50/70 dark:from-orange-950/20 dark:via-slate-900/40 dark:to-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#e77817]/15 dark:bg-[#e77817]/25 text-[#e77817] border border-[#e77817]/30 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                Advance Balance Available: <span className="text-[#e77817]">{fmt(clientAvailableAdvance)}</span>
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                This client has available advance credit. You can apply it directly to settle this invoice (Balance Due: <span className="font-semibold text-slate-800 dark:text-slate-200">{fmt(Number(invoice.balance_due))}</span>).
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleQuickSettleWithAdvance}
            className="bg-[#e77817] hover:bg-[#d66d13] text-white font-medium shadow-sm shrink-0 border border-orange-600/30"
          >
            <Wallet className="mr-1.5 h-4 w-4" />
            Adjust Advance ({fmt(Math.min(clientAvailableAdvance, Number(invoice.balance_due)))})
          </Button>
        </div>
      )}

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
                  <TableHead className="w-16 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.payment_date}</TableCell>
                    <TableCell className="font-medium text-primary">{p.payment_number}</TableCell>
                    <TableCell>
                      {p.payment_mode === "advance_credit" ? (
                        <Badge variant="outline" className="border-blue-500/70 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/20 text-[11px] font-medium">
                          Advance Adjusted
                        </Badge>
                      ) : (
                        <span className="capitalize">{p.payment_mode.replace("_", " ")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">{fmt(Number(p.amount))}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="Delete received payment"
                        onClick={() => {
                          setPaymentToDelete(p);
                          setDeletePaymentDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
            {clientAvailableAdvance > 0.001 && (
              <div className="p-3 rounded-lg border-2 border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-950 dark:text-emerald-100 block">
                      Available Advance Credit: {fmt(clientAvailableAdvance)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Client has unallocated advance payment that can be applied here.
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-100 shrink-0"
                  onClick={() => {
                    const toApply = Math.min(clientAvailableAdvance, Number(invoice.balance_due));
                    setPaymentForm((f) => ({ ...f, amount: toApply, payment_mode: "advance_credit" }));
                  }}
                >
                  Use Advance ({fmt(Math.min(clientAvailableAdvance, Number(invoice.balance_due)))})
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} />
              {paymentForm.payment_mode !== "advance_credit" && paymentForm.amount > Number(invoice.balance_due) && (
                <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block">⚠️ Excess Payment Detected:</span>
                  {fmt(Number(invoice.balance_due))} will clear this invoice. The remaining excess of <strong>{fmt(paymentForm.amount - Number(invoice.balance_due))}</strong> will be automatically saved as Customer Advance Credit for future invoices.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentForm.payment_mode} onValueChange={(v) => handlePaymentModeChange(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clientAvailableAdvance > 0.001 && (
                    <SelectItem value="advance_credit">
                      Advance Credit ({fmt(clientAvailableAdvance)} Available)
                    </SelectItem>
                  )}
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {paymentForm.payment_mode !== "advance_credit" ? (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Deposit To Account *</span>
                  {selectedAccount && (
                    <span className="text-xs text-muted-foreground font-normal">
                      Bal: {fmt(Number(selectedAccount.current_balance || 0))}
                    </span>
                  )}
                </Label>
                <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Bank / Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-medium">
                            {b.bank_name ? `${b.bank_name} ${b.account_number ? `(..${b.account_number.slice(-4)})` : ''}` : b.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted/60">
                            {b.account_type || 'Bank'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-2.5 rounded border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-blue-900 dark:text-blue-200">
                Settled directly against advance payment credit. No fresh bank account deposit is recorded.
              </div>
            )}
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

      {/* Delete Payment Dialog */}
      <AlertDialog open={deletePaymentDialogOpen} onOpenChange={setDeletePaymentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment {paymentToDelete?.payment_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment of <strong>{fmt(Number(paymentToDelete?.amount || 0))}</strong>?
              This will reverse the payment from this invoice, increase the balance due, and revert any bank account deposit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPayment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={deletingPayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPayment ? "Deleting..." : "Delete Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Invoice Dialog */}
      <AlertDialog open={deleteInvoiceDialogOpen} onOpenChange={setDeleteInvoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice {invoice?.invoice_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invoice, restock any inventory items, and delete associated payments and portal tokens.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingInvoice}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={deletingInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingInvoice ? "Deleting..." : "Delete Invoice"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Void Invoice Dialog */}
      <AlertDialog open={voidInvoiceDialogOpen} onOpenChange={setVoidInvoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel / Void Invoice {invoice?.invoice_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Marking this invoice as <strong>VOID</strong> will cancel the transaction, reset the balance due to 0, and restore all stock items to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={voidingInvoice}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVoid}
              disabled={voidingInvoice}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {voidingInvoice ? "Cancelling..." : "Confirm Void"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PlanSelectorModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        orgId={org?.id}
      />
    </div>
  );
}

