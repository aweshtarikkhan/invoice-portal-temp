const fs = require('fs');

// 1. Fix InvoiceBuilderPage
let invCode = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');
if (!invCode.includes('postInvoiceJournal')) {
  invCode = invCode.replace('import { supabase } from "@/integrations/supabase/client";', 'import { supabase } from "@/integrations/supabase/client";\nimport { postInvoiceJournal } from "@/lib/accounting";');
  
  const invJournalCall = `
        // Sync Journal Entry
        try {
          const subtotal = linePayloads.reduce((sum, line) => sum + (line.rate * line.quantity), 0);
          const taxTotal = linePayloads.reduce((sum, line) => sum + (line.tax_amount || 0), 0);
          await postInvoiceJournal(org!.id, invoiceId, invoicePayload.issue_date, invoicePayload.invoice_number, subtotal, taxTotal, Number(invoicePayload.total), invoicePayload.branch_id || null);
        } catch (jErr) {
          console.error("Journal sync failed:", jErr);
        }
`;
  // Insert right after invoice_lines insert
  invCode = invCode.replace('await supabase.from("invoice_lines").insert(linePayloads);', 'await supabase.from("invoice_lines").insert(linePayloads);\n' + invJournalCall);
  fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', invCode);
}

// 2. Fix RecordPaymentPage
let payCode = fs.readFileSync('src/pages/RecordPaymentPage.tsx', 'utf8');
if (!payCode.includes('postPaymentJournal')) {
  payCode = payCode.replace('import { supabase } from "@/integrations/supabase/client";', 'import { supabase } from "@/integrations/supabase/client";\nimport { postPaymentJournal } from "@/lib/accounting";');
  
  const payJournalCall = `
      // Sync Journal Entry
      try {
        await postPaymentJournal(org!.id, payData.id, paymentDate, reference, numericAmount, paymentMethod, null);
      } catch (jErr) {
        console.error("Journal sync failed:", jErr);
      }
`;
  // Insert right after payment insert
  payCode = payCode.replace('toast({ title: "Payment recorded successfully" });', payJournalCall + '\n      toast({ title: "Payment recorded successfully" });');
  fs.writeFileSync('src/pages/RecordPaymentPage.tsx', payCode);
}

console.log('Accounting integration completed');
