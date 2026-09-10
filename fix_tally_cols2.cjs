const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace(/invoice_date: txn\.date \|\| new Date\(\)\.toISOString\(\),/g, '');
c = c.replace(/due_date: txn\.date \|\| new Date\(\)\.toISOString\(\),/g, 'due_date: txn.date || new Date().toISOString(),');

const regex = /const txnData: any = \{\s*org_id: org\.id,\s*\.\.\.\(isInvoice \? \{ invoice_number: txn\.reference \} : \{ bill_number: txn\.reference \}\),\s*due_date: txn\.date \|\| new Date\(\)\.toISOString\(\),\s*total: txn\.amount,\s*balance_due: txn\.amount,[^\n]*\n\s*status: "sent",\s*notes: txn\.narration \|\| "",\s*\};/m;

const replacement = `const txnData: any = {
              org_id: org.id,
              ...(isInvoice ? { invoice_number: txn.reference, issue_date: txn.date || new Date().toISOString() } : { bill_number: txn.reference, bill_date: txn.date || new Date().toISOString() }),
              due_date: txn.date || new Date().toISOString(),
              total: txn.amount,
              balance_due: txn.amount,
              status: isInvoice ? "sent" : "received",
              notes: txn.narration || "",
            };`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('REALLY Fixed columns');
