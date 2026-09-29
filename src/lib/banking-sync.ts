import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures a Cash account exists for the organization.
 */
export async function getOrCreateCashAccount(orgId: string, currency: string = "INR") {
  try {
    const { data: existing } = await (supabase as any)
      .from("bank_accounts")
      .select("*")
      .eq("org_id", orgId)
      .eq("account_type", "cash")
      .maybeSingle();

    if (existing) return existing;

    const { data: newCash, error } = await (supabase as any)
      .from("bank_accounts")
      .insert({
        org_id: orgId,
        name: "Cash in Hand",
        account_type: "cash",
        opening_balance: 0,
        current_balance: 0,
        currency: currency || "INR",
        is_active: true,
      })
      .select()
      .single();

    if (!error && newCash) return newCash;
    return existing || null;
  } catch (err) {
    console.error("Error in getOrCreateCashAccount:", err);
    return null;
  }
}

/**
 * Record a credit transaction in bank_transactions and update bank account balance
 * when a payment is received.
 */
export async function recordPaymentBankingTransaction(params: {
  orgId: string;
  bankAccountId: string;
  amount: number;
  paymentDate: string;
  invoiceNumber?: string;
  clientName?: string;
  referenceNumber?: string;
  paymentId?: string;
  paymentNumber?: string;
  notes?: string;
}) {
  const {
    orgId,
    bankAccountId,
    amount,
    paymentDate,
    invoiceNumber,
    clientName,
    referenceNumber,
    paymentId,
    paymentNumber,
    notes,
  } = params;

  if (!orgId || !bankAccountId || !amount || amount <= 0) return null;

  try {
    const descParts = ["Payment received"];
    if (invoiceNumber) descParts.push(`for ${invoiceNumber}`);
    if (clientName) descParts.push(`from ${clientName}`);
    const description = descParts.join(" ");

    // 1. Fetch current bank account to get balance_after
    const { data: account } = await (supabase as any)
      .from("bank_accounts")
      .select("current_balance")
      .eq("id", bankAccountId)
      .single();

    const previousBalance = Number(account?.current_balance || 0);
    const newBalance = previousBalance + Number(amount);

    // 2. Insert into bank_transactions
    const { data: txn, error: txnErr } = await (supabase as any)
      .from("bank_transactions")
      .insert({
        org_id: orgId,
        bank_account_id: bankAccountId,
        txn_date: paymentDate || new Date().toISOString().slice(0, 10),
        amount: Number(amount),
        direction: "credit",
        description,
        reference: referenceNumber || paymentNumber || null,
        counterparty: clientName || null,
        balance_after: newBalance,
        source: "payment_received",
        reconciled: true,
        reconciled_at: new Date().toISOString(),
        matched_type: "payment",
        matched_id: paymentId || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (txnErr) {
      console.error("Error creating bank_transaction:", txnErr);
    }

    // 3. Update bank account balance
    await (supabase as any)
      .from("bank_accounts")
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bankAccountId);

    return txn;
  } catch (err) {
    console.error("Exception in recordPaymentBankingTransaction:", err);
    return null;
  }
}

/**
 * Revert a bank transaction when a payment is deleted or removed.
 */
export async function revertPaymentBankingTransaction(paymentId: string) {
  try {
    const { data: txns } = await (supabase as any)
      .from("bank_transactions")
      .select("*")
      .eq("matched_id", paymentId);

    for (const t of txns || []) {
      const { data: acct } = await (supabase as any)
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", t.bank_account_id)
        .single();

      if (acct) {
        const updatedBal = Number(acct.current_balance || 0) - Number(t.amount);
        await (supabase as any)
          .from("bank_accounts")
          .update({ current_balance: updatedBal })
          .eq("id", t.bank_account_id);
      }

      await (supabase as any)
        .from("bank_transactions")
        .delete()
        .eq("id", t.id);
    }
  } catch (err) {
    console.error("Error in revertPaymentBankingTransaction:", err);
  }
}
