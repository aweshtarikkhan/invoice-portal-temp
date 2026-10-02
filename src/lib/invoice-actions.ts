import { supabase } from "@/integrations/supabase/client";
import { revertPaymentBankingTransaction } from "@/lib/banking-sync";
import { restoreInvoiceStock } from "@/lib/stock";
import { logAudit } from "@/lib/audit";

/**
 * Safely delete a payment record, restoring any linked invoice's balance & status,
 * and reverting any banking transaction and bank balance impact.
 */
export async function deleteSinglePayment(paymentId: string): Promise<{ success: boolean; error?: string; invoiceId?: string | null }> {
  try {
    // 1. Fetch payment details
    const { data: payment, error: fetchErr } = await (supabase as any)
      .from("payments")
      .select("id, invoice_id, client_id, amount, payment_number")
      .eq("id", paymentId)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const invoiceId = payment.invoice_id;
    const amount = Number(payment.amount || 0);

    // 2. Revert banking transaction and account balance
    await revertPaymentBankingTransaction(paymentId);

    // 3. Delete the payment record
    const { error: delErr } = await (supabase as any)
      .from("payments")
      .delete()
      .eq("id", paymentId);

    if (delErr) throw delErr;

    // 4. If linked to an invoice, restore invoice's balance_due and amount_paid
    if (invoiceId) {
      const { data: inv } = await (supabase as any)
        .from("invoices")
        .select("id, total, balance_due, amount_paid, status, due_date")
        .eq("id", invoiceId)
        .maybeSingle();

      if (inv) {
        const newPaid = Math.max(0, Number(inv.amount_paid || 0) - amount);
        const newBalance = Math.min(Number(inv.total || 0), Number(inv.total || 0) - newPaid);
        let newStatus = inv.status;
        if (newPaid <= 0) {
          const isOverdue = inv.due_date && new Date(inv.due_date) < new Date();
          newStatus = isOverdue ? "overdue" : "sent";
        } else if (newPaid < Number(inv.total || 0)) {
          newStatus = "partial";
        }

        await (supabase as any)
          .from("invoices")
          .update({
            amount_paid: newPaid,
            balance_due: newBalance,
            status: newStatus,
            paid_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invoiceId);
      }
    }

    return { success: true, invoiceId };
  } catch (err: any) {
    console.error("Error in deleteSinglePayment:", err);
    return { success: false, error: err?.message || "Failed to delete payment" };
  }
}

/**
 * Safely delete an invoice, unlinking any foreign key constraints (estimates, credit notes, delivery challans),
 * reverting/deleting attached payments, restocking inventory items, and removing lines.
 */
export async function deleteInvoiceRecord(
  invoiceId: string,
  orgId: string,
  userId?: string
): Promise<{ success: boolean; error?: string; restoredCount: number }> {
  try {
    const { data: inv } = await (supabase as any)
      .from("invoices")
      .select("id, invoice_number, status, total")
      .eq("id", invoiceId)
      .maybeSingle();

    if (!inv) {
      return { success: false, error: "Invoice not found", restoredCount: 0 };
    }

    // 1. Unlink foreign keys that would block deletion with RESTRICT / NO ACTION
    // Estimates converted to this invoice
    await (supabase as any)
      .from("estimates")
      .update({ converted_invoice_id: null })
      .eq("converted_invoice_id", invoiceId);

    // Credit notes linked to this invoice
    await (supabase as any)
      .from("credit_notes")
      .update({ invoice_id: null })
      .eq("invoice_id", invoiceId);

    // Delivery challans linked to this invoice
    await (supabase as any)
      .from("delivery_challans")
      .update({ invoice_id: null })
      .eq("invoice_id", invoiceId);

    // Recurring invoice templates linked to this invoice
    await (supabase as any)
      .from("recurring_invoices")
      .update({ template_invoice_id: null })
      .eq("template_invoice_id", invoiceId);

    // 2. Revert banking transactions for any payments attached to this invoice, then delete payments
    const { data: relatedPayments } = await (supabase as any)
      .from("payments")
      .select("id")
      .eq("invoice_id", invoiceId);

    if (relatedPayments && relatedPayments.length > 0) {
      for (const p of relatedPayments) {
        await revertPaymentBankingTransaction(p.id);
      }
      await (supabase as any)
        .from("payments")
        .delete()
        .eq("invoice_id", invoiceId);
    }

    // 3. Restore inventory stock if the invoice is not void
    let restoredCount = 0;
    if (inv.status !== "void") {
      const res = await restoreInvoiceStock(
        invoiceId,
        orgId,
        `Invoice ${inv.invoice_number || invoiceId} deleted / restocked`,
        inv.invoice_number,
        userId
      );
      restoredCount = res.restoredCount;
    }

    // 4. Delete invoice line items & portal tokens
    await (supabase as any).from("invoice_lines").delete().eq("invoice_id", invoiceId);
    await (supabase as any).from("portal_tokens").delete().eq("entity_id", invoiceId).eq("entity_type", "invoice");

    // 5. Delete the invoice itself
    const { error: delErr } = await (supabase as any)
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (delErr) throw delErr;

    // 6. Log audit if user context is available
    if (orgId && userId) {
      await logAudit({
        orgId,
        userId,
        entityType: "invoice",
        entityId: invoiceId,
        action: "delete",
        description: `Invoice ${inv.invoice_number} deleted permanently${restoredCount > 0 ? ` & ${restoredCount} items restocked` : ""}`,
        metadata: {
          invoice_number: inv.invoice_number,
          total: inv.total,
          restoredCount,
        },
      });
    }

    return { success: true, restoredCount };
  } catch (err: any) {
    console.error("Error in deleteInvoiceRecord:", err);
    return { success: false, error: err?.message || "Failed to delete invoice", restoredCount: 0 };
  }
}

/**
 * Safely cancel/void an invoice, restocking inventory items and marking balance_due as 0.
 */
export async function cancelVoidInvoiceRecord(
  invoiceId: string,
  orgId: string,
  userId?: string
): Promise<{ success: boolean; error?: string; restoredCount: number }> {
  try {
    const { data: inv } = await (supabase as any)
      .from("invoices")
      .select("id, invoice_number, status, total")
      .eq("id", invoiceId)
      .maybeSingle();

    if (!inv) {
      return { success: false, error: "Invoice not found", restoredCount: 0 };
    }

    if (inv.status === "void") {
      return { success: true, restoredCount: 0 };
    }

    // 1. Restore inventory stock
    const { restoredCount } = await restoreInvoiceStock(
      invoiceId,
      orgId,
      `Invoice ${inv.invoice_number || invoiceId} cancelled / voided`,
      inv.invoice_number,
      userId
    );

    // 2. Mark invoice as void with balance_due = 0
    const { error: updErr } = await (supabase as any)
      .from("invoices")
      .update({
        status: "void",
        balance_due: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updErr) throw updErr;

    // 3. Log audit
    if (orgId && userId) {
      await logAudit({
        orgId,
        userId,
        entityType: "invoice",
        entityId: invoiceId,
        action: "void",
        description: `Invoice ${inv.invoice_number} voided & ${restoredCount} items restocked to inventory`,
        metadata: {
          previous_status: inv.status,
          new_status: "void",
          items_restored: restoredCount,
          invoice_total: inv.total,
        },
      });
    }

    return { success: true, restoredCount };
  } catch (err: any) {
    console.error("Error in cancelVoidInvoiceRecord:", err);
    return { success: false, error: err?.message || "Failed to void invoice", restoredCount: 0 };
  }
}
