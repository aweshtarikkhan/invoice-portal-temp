const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

// Fix invoice_date vs issue_date and bill_date
const badLogic = `
              const txnData: any = {
                org_id: org.id,
                ...(isInvoice ? { invoice_number: txn.reference } : { bill_number: txn.reference }),
                invoice_date: txn.date || new Date().toISOString(),
                due_date: txn.date || new Date().toISOString(),
                total: txn.amount,
                balance_due: txn.amount, // Payments will adjust this if we link them, but Tally handles it separately
                status: "sent",
                notes: txn.narration || "",
              };
`;

const goodLogic = `
              const txnData: any = {
                org_id: org.id,
                ...(isInvoice ? { invoice_number: txn.reference, issue_date: txn.date || new Date().toISOString() } : { bill_number: txn.reference, bill_date: txn.date || new Date().toISOString() }),
                due_date: txn.date || new Date().toISOString(),
                total: txn.amount,
                balance_due: txn.amount,
                status: isInvoice ? "sent" : "received",
                notes: txn.narration || "",
              };
`;

if (c.includes('invoice_date: txn.date')) {
  c = c.replace(badLogic.trim(), goodLogic.trim());
  fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
  console.log('Fixed TallySyncPage columns (issue_date, bill_date)');
} else {
  console.log('Could not find bad logic');
}
