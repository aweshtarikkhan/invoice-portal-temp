import { supabase } from "@/integrations/supabase/client";

/**
 * Helpers to post double-entry journal entries for various business transactions.
 * Looks up system accounts by code so seed_default_accounting must have run for the org.
 */

async function getAccountMap(orgId: string) {
  const { data } = await (supabase as any).from("accounts").select("id,code").eq("org_id", orgId);
  const map: Record<string, string> = {};
  (data || []).forEach((a: any) => { map[a.code] = a.id; });
  return map;
}

async function createEntry(orgId: string, entryDate: string, narration: string, sourceType: string, sourceId: string, lines: { account_id: string; debit?: number; credit?: number; description?: string; branch_id?: string | null }[], branchId: string | null = null) {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const { data: entry, error } = await (supabase as any).from("journal_entries").insert({
    org_id: orgId, entry_date: entryDate, reference: sourceType + "/" + sourceId.slice(0, 8),
    narration, source_type: sourceType, source_id: sourceId,
    total_debit: totalDebit, total_credit: totalCredit, branch_id: branchId, is_posted: true,
  }).select().single();
  if (error) throw error;
  const payload = lines.filter(l => (l.debit || 0) > 0 || (l.credit || 0) > 0).map((l, idx) => ({
    org_id: orgId, entry_id: entry.id, account_id: l.account_id,
    debit: l.debit || 0, credit: l.credit || 0,
    description: l.description, sort_order: idx, branch_id: l.branch_id || branchId,
  }));
  if (payload.length) {
    const { error: e2 } = await (supabase as any).from("journal_lines").insert(payload);
    if (e2) throw e2;
  }
  return entry.id;
}

export async function postBillJournal(orgId: string, billId: string, billDate: string, billNumber: string, _vendorId: string, lines: any[], taxTotal: number, tdsAmount: number, total: number, branchId: string | null) {
  const acc = await getAccountMap(orgId);
  const ap = acc["2000"], inputGst = acc["1300"], tdsPayable = acc["2200"], fallbackExp = acc["5100"];
  const jl: any[] = [];
  // Debits: expense accounts (per line)
  lines.forEach((l: any) => {
    if (l.amount > 0) {
      jl.push({ account_id: l.account_id || fallbackExp, debit: Number(l.amount), description: l.description });
    }
  });
  if (taxTotal > 0 && inputGst) jl.push({ account_id: inputGst, debit: taxTotal, description: "Input GST" });
  // Credits: AP + TDS Payable
  if (tdsAmount > 0 && tdsPayable) jl.push({ account_id: tdsPayable, credit: tdsAmount, description: "TDS deducted" });
  if (ap) jl.push({ account_id: ap, credit: total, description: "Accounts Payable" });
  // Delete previous JE for same source, then post fresh
  await (supabase as any).from("journal_entries").delete().eq("source_type", "bill").eq("source_id", billId);
  await createEntry(orgId, billDate, `Bill ${billNumber}`, "bill", billId, jl, branchId);
}

export async function postBillPaymentJournal(orgId: string, paymentId: string, payDate: string, billNumber: string, _vendorId: string, amount: number, method: string, branchId: string | null) {
  const acc = await getAccountMap(orgId);
  const ap = acc["2000"];
  const credit = method === "cash" ? acc["1000"] : acc["1010"];
  if (!ap || !credit) return;
  await (supabase as any).from("journal_entries").delete().eq("source_type", "bill_payment").eq("source_id", paymentId);
  await createEntry(orgId, payDate, `Payment for ${billNumber}`, "bill_payment", paymentId, [
    { account_id: ap, debit: amount, description: "AP settlement" },
    { account_id: credit, credit: amount, description: `Paid via ${method}` },
  ], branchId);
}

export async function postInvoiceJournal(orgId: string, invoiceId: string, invDate: string, invNumber: string, subtotal: number, taxTotal: number, total: number, branchId: string | null) {
  const acc = await getAccountMap(orgId);
  const ar = acc["1100"], sales = acc["4000"], outGst = acc["2100"];
  if (!ar || !sales) return;
  const jl: any[] = [
    { account_id: ar, debit: total, description: "Accounts Receivable" },
    { account_id: sales, credit: subtotal, description: "Sales" },
  ];
  if (taxTotal > 0 && outGst) jl.push({ account_id: outGst, credit: taxTotal, description: "Output GST" });
  await (supabase as any).from("journal_entries").delete().eq("source_type", "invoice").eq("source_id", invoiceId);
  await createEntry(orgId, invDate, `Invoice ${invNumber}`, "invoice", invoiceId, jl, branchId);
}

export async function postPaymentJournal(orgId: string, paymentId: string, payDate: string, ref: string, amount: number, method: string, branchId: string | null) {
  const acc = await getAccountMap(orgId);
  const ar = acc["1100"];
  const debit = method === "cash" ? acc["1000"] : acc["1010"];
  if (!ar || !debit) return;
  await (supabase as any).from("journal_entries").delete().eq("source_type", "payment").eq("source_id", paymentId);
  await createEntry(orgId, payDate, `Payment received ${ref}`, "payment", paymentId, [
    { account_id: debit, debit: amount, description: `Received via ${method}` },
    { account_id: ar, credit: amount, description: "AR settlement" },
  ], branchId);
}

// ─── Salary & Payroll Accounting ──────────────────────────────────────────────

const SALARY_ACCOUNTS = [
  { code: "5200", name: "Salary & Wages Expense", type: "expense", description: "Employee salaries and wages" },
  { code: "5210", name: "Overtime Pay", type: "expense", description: "Overtime compensation" },
  { code: "5220", name: "Bonus & Incentives", type: "expense", description: "Employee bonuses and incentives" },
  { code: "2210", name: "PF Payable", type: "liability", description: "Provident Fund payable (employer + employee)" },
  { code: "2220", name: "ESIC Payable", type: "liability", description: "ESIC contribution payable" },
  { code: "2230", name: "Professional Tax Payable", type: "liability", description: "Professional tax payable" },
  { code: "2240", name: "Salary Payable", type: "liability", description: "Net salary payable to employees" },
];

/**
 * Ensures salary-related accounts exist in the chart of accounts.
 * Called before posting any salary journal entry.
 */
export async function ensureSalaryAccounts(orgId: string) {
  const { data: existing } = await (supabase as any).from("accounts").select("code").eq("org_id", orgId);
  const existingCodes = new Set((existing || []).map((a: any) => a.code));

  const missing = SALARY_ACCOUNTS.filter(a => !existingCodes.has(a.code));
  if (missing.length === 0) return;

  const rows = missing.map(a => ({ ...a, org_id: orgId, is_system: true }));
  await (supabase as any).from("accounts").insert(rows);
}

/** Data shape for posting a payroll journal entry */
export interface PayrollJournalData {
  runId: string;
  entryDate: string;
  monthLabel: string;
  totalGross: number;
  totalBasic: number;
  totalHra: number;
  totalAllowances: number;
  totalOvertimePay: number;
  totalBonusIncentive: number;
  totalPfEmployee: number;
  totalPfEmployer: number;
  totalEsicEmployee: number;
  totalEsicEmployer: number;
  totalTds: number;
  totalPt: number;
  totalOtherDeductions: number;
  totalNetPay: number;
  branchId?: string | null;
}

/**
 * Posts a double-entry journal when a payroll run is approved.
 *
 * Dr  5200 Salary & Wages Expense   (gross salary - overtime - bonus)
 * Dr  5210 Overtime Pay             (overtime amount)
 * Dr  5220 Bonus & Incentives       (bonus amount)
 *   Cr  2210 PF Payable             (PF employee + employer)
 *   Cr  2220 ESIC Payable           (ESIC employee + employer)
 *   Cr  2200 TDS Payable            (TDS deducted)
 *   Cr  2230 PT Payable             (Professional Tax)
 *   Cr  2240 Salary Payable         (net pay)
 */
export async function postPayrollJournal(orgId: string, data: PayrollJournalData) {
  await ensureSalaryAccounts(orgId);
  const acc = await getAccountMap(orgId);

  const salaryExp = acc["5200"];
  const overtimeExp = acc["5210"];
  const bonusExp = acc["5220"];
  const pfPayable = acc["2210"];
  const esicPayable = acc["2220"];
  const tdsPayable = acc["2200"];
  const ptPayable = acc["2230"];
  const salaryPayable = acc["2240"];

  if (!salaryExp || !salaryPayable) return;

  const jl: { account_id: string; debit?: number; credit?: number; description?: string }[] = [];

  // Debits — Expense accounts
  const baseSalaryExp = data.totalGross - data.totalOvertimePay - data.totalBonusIncentive;
  if (baseSalaryExp > 0) {
    jl.push({ account_id: salaryExp, debit: +baseSalaryExp.toFixed(2), description: "Salary & Wages" });
  }
  if (data.totalOvertimePay > 0 && overtimeExp) {
    jl.push({ account_id: overtimeExp, debit: +data.totalOvertimePay.toFixed(2), description: "Overtime Pay" });
  }
  if (data.totalBonusIncentive > 0 && bonusExp) {
    jl.push({ account_id: bonusExp, debit: +data.totalBonusIncentive.toFixed(2), description: "Bonus & Incentives" });
  }

  // Employer contributions as expense
  if (data.totalPfEmployer > 0) {
    jl.push({ account_id: salaryExp, debit: +data.totalPfEmployer.toFixed(2), description: "PF Employer Contribution" });
  }
  if (data.totalEsicEmployer > 0) {
    jl.push({ account_id: salaryExp, debit: +data.totalEsicEmployer.toFixed(2), description: "ESIC Employer Contribution" });
  }

  // Credits — Liability accounts
  const totalPf = data.totalPfEmployee + data.totalPfEmployer;
  if (totalPf > 0 && pfPayable) {
    jl.push({ account_id: pfPayable, credit: +totalPf.toFixed(2), description: "PF Payable" });
  }
  const totalEsic = data.totalEsicEmployee + data.totalEsicEmployer;
  if (totalEsic > 0 && esicPayable) {
    jl.push({ account_id: esicPayable, credit: +totalEsic.toFixed(2), description: "ESIC Payable" });
  }
  if (data.totalTds > 0 && tdsPayable) {
    jl.push({ account_id: tdsPayable, credit: +data.totalTds.toFixed(2), description: "TDS Payable" });
  }
  if (data.totalPt > 0 && ptPayable) {
    jl.push({ account_id: ptPayable, credit: +data.totalPt.toFixed(2), description: "Professional Tax Payable" });
  }
  if (data.totalNetPay > 0 && salaryPayable) {
    jl.push({ account_id: salaryPayable, credit: +data.totalNetPay.toFixed(2), description: "Net Salary Payable" });
  }

  if (jl.length === 0) return;

  // Delete any previous JE for same payroll run, then post fresh
  await (supabase as any).from("journal_entries").delete().eq("source_type", "payroll").eq("source_id", data.runId);
  await createEntry(orgId, data.entryDate, `Payroll — ${data.monthLabel}`, "payroll", data.runId, jl, data.branchId || null);
}

/**
 * Posts a journal when payroll is marked as paid (cash/bank outflow).
 *
 * Dr  2240 Salary Payable   (net pay)
 *   Cr  1010 Bank / 1000 Cash  (net pay)
 */
export async function postPayrollPaymentJournal(orgId: string, runId: string, payDate: string, monthLabel: string, netPay: number, method: string = "bank", branchId: string | null = null) {
  await ensureSalaryAccounts(orgId);
  const acc = await getAccountMap(orgId);

  const salaryPayable = acc["2240"];
  const bankOrCash = method === "cash" ? acc["1000"] : acc["1010"];

  if (!salaryPayable || !bankOrCash || netPay <= 0) return;

  await (supabase as any).from("journal_entries").delete().eq("source_type", "payroll_payment").eq("source_id", runId);
  await createEntry(orgId, payDate, `Salary Payment — ${monthLabel}`, "payroll_payment", runId, [
    { account_id: salaryPayable, debit: +netPay.toFixed(2), description: "Salary Payable settled" },
    { account_id: bankOrCash, credit: +netPay.toFixed(2), description: `Paid via ${method}` },
  ], branchId);
}

/**
 * Posts a journal for daily/hourly wager payment.
 *
 * Dr  5200 Salary & Wages Expense   (total payout)
 *   Cr  1000 Cash / 1010 Bank       (total payout)
 */
export async function postWagerPaymentJournal(orgId: string, sourceId: string, payDate: string, workerName: string, totalPayout: number, method: string = "cash", branchId: string | null = null) {
  await ensureSalaryAccounts(orgId);
  const acc = await getAccountMap(orgId);

  const salaryExp = acc["5200"];
  const bankOrCash = method === "cash" ? acc["1000"] : acc["1010"];

  if (!salaryExp || !bankOrCash || totalPayout <= 0) return;

  await (supabase as any).from("journal_entries").delete().eq("source_type", "wager_payment").eq("source_id", sourceId);
  await createEntry(orgId, payDate, `Wage Payment — ${workerName}`, "wager_payment", sourceId, [
    { account_id: salaryExp, debit: +totalPayout.toFixed(2), description: `Wages for ${workerName}` },
    { account_id: bankOrCash, credit: +totalPayout.toFixed(2), description: `Paid via ${method}` },
  ], branchId);
}
