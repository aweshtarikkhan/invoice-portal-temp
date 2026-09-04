/**
 * Expense ↔ Journal Entry Sync
 * 
 * When a business expense is created/updated/deleted, this module
 * ensures a corresponding double-entry journal entry exists in the
 * accounting ledger:
 *   Debit:  Expense Account (e.g. "Salary Expense")
 *   Credit: Cash & Bank Account
 */

import { supabase } from "@/integrations/supabase/client";

// Map expense categories to account names and codes
const CATEGORY_ACCOUNT_MAP: Record<string, { code: string; name: string }> = {
  "Salary":                { code: "5001", name: "Salary Expense" },
  "Rent":                  { code: "5002", name: "Rent Expense" },
  "Electricity":           { code: "5003", name: "Electricity Expense" },
  "Internet":              { code: "5004", name: "Internet Expense" },
  "Office Supplies":       { code: "5005", name: "Office Supplies Expense" },
  "Software/Subscriptions":{ code: "5006", name: "Software & Subscriptions" },
  "Transportation":        { code: "5007", name: "Transportation Expense" },
  "Insurance":             { code: "5008", name: "Insurance Expense" },
  "Maintenance":           { code: "5009", name: "Maintenance Expense" },
  "Marketing":             { code: "5010", name: "Marketing Expense" },
  "Legal/Accounting":      { code: "5011", name: "Legal & Accounting Expense" },
  "Taxes & Fees":          { code: "5012", name: "Taxes & Fees" },
  "Others":                { code: "5099", name: "Other Expenses" },
  "Miscellaneous":         { code: "5099", name: "Other Expenses" },
};

const CASH_ACCOUNT = { code: "1001", name: "Cash & Bank" };

/**
 * Find or create an account in the Chart of Accounts
 */
async function ensureAccount(
  orgId: string,
  code: string,
  name: string,
  type: "asset" | "expense"
): Promise<string> {
  // Try to find existing
  const { data: existing } = await (supabase as any)
    .from("accounts")
    .select("id")
    .eq("org_id", orgId)
    .eq("code", code)
    .maybeSingle();

  if (existing?.id) return existing.id;

  // Create new
  const { data: created, error } = await (supabase as any)
    .from("accounts")
    .insert({
      org_id: orgId,
      code,
      name,
      type,
      description: `Auto-created for expense tracking`,
      is_system: true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create account:", error);
    throw error;
  }

  return created.id;
}

/**
 * Create a journal entry for a new expense
 */
export async function createExpenseJournalEntry(
  orgId: string,
  expenseId: string,
  category: string,
  amount: number,
  expenseDate: string,
  description: string | null
): Promise<void> {
  // Skip journal sync for Payroll expenses because they are handled
  // by postPayrollJournal in the payroll module.
  if (description?.startsWith("Payroll —")) return;

  try {
    const categoryInfo = CATEGORY_ACCOUNT_MAP[category] || CATEGORY_ACCOUNT_MAP["Others"] || CATEGORY_ACCOUNT_MAP["Miscellaneous"];

    // Ensure both accounts exist
    const [expenseAccountId, cashAccountId] = await Promise.all([
      ensureAccount(orgId, categoryInfo.code, categoryInfo.name, "expense"),
      ensureAccount(orgId, CASH_ACCOUNT.code, CASH_ACCOUNT.name, "asset"),
    ]);

    // Create journal entry header
    const narration = `Expense: ${category}${description ? ` - ${description}` : ""}`;
    const { data: entry, error: entryError } = await (supabase as any)
      .from("journal_entries")
      .insert({
        org_id: orgId,
        entry_date: expenseDate,
        narration,
        source_type: "expense",
        total_debit: amount,
        total_credit: amount,
        is_posted: true,
      })
      .select("id")
      .single();

    if (entryError) {
      console.error("Failed to create journal entry:", entryError);
      return;
    }

    // Create journal lines (double-entry)
    const lines = [
      {
        org_id: orgId,
        entry_id: entry.id,
        account_id: expenseAccountId,
        debit: amount,
        credit: 0,
        description: `${category} expense`,
        sort_order: 1,
      },
      {
        org_id: orgId,
        entry_id: entry.id,
        account_id: cashAccountId,
        debit: 0,
        credit: amount,
        description: `Payment for ${category}`,
        sort_order: 2,
      },
    ];

    const { error: linesError } = await (supabase as any)
      .from("journal_lines")
      .insert(lines);

    if (linesError) {
      console.error("Failed to create journal lines:", linesError);
      // Clean up the entry if lines failed
      await (supabase as any).from("journal_entries").delete().eq("id", entry.id);
    }
  } catch (err) {
    console.error("Expense journal sync failed:", err);
  }
}

/**
 * Delete journal entries associated with an expense
 * (Finds by matching narration pattern and source_type)
 */
export async function deleteExpenseJournalEntry(
  orgId: string,
  category: string,
  amount: number,
  expenseDate: string,
  description: string | null
): Promise<void> {
  if (description?.startsWith("Payroll —")) return;

  try {
    // Find matching journal entry
    const { data: entries } = await (supabase as any)
      .from("journal_entries")
      .select("id")
      .eq("org_id", orgId)
      .eq("entry_date", expenseDate)
      .eq("total_debit", amount)
      .eq("source_type", "expense")
      .ilike("narration", `Expense: ${category}%`)
      .limit(1);

    if (!entries || entries.length === 0) return;

    const entryId = entries[0].id;

    // Delete lines first, then entry
    await (supabase as any).from("journal_lines").delete().eq("entry_id", entryId);
    await (supabase as any).from("journal_entries").delete().eq("id", entryId);
  } catch (err) {
    console.error("Failed to delete expense journal entry:", err);
  }
}

/**
 * Update journal entry when expense is modified
 */
export async function updateExpenseJournalEntry(
  orgId: string,
  oldCategory: string,
  oldAmount: number,
  oldDate: string,
  oldDescription: string | null,
  newCategory: string,
  newAmount: number,
  newDate: string,
  newDescription: string | null
): Promise<void> {
  // Delete old entry and create new one
  await deleteExpenseJournalEntry(orgId, oldCategory, oldAmount, oldDate, oldDescription);
  await createExpenseJournalEntry(orgId, "", newCategory, newAmount, newDate, newDescription);
}
