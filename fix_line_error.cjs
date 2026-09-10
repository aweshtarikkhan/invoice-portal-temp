const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('await supabase.from(isInvoice ? "invoice_lines" : "bill_lines").insert(lines);', 'const { error: lineErr } = await supabase.from(isInvoice ? "invoice_lines" : "bill_lines").insert(lines);\n              if (lineErr) syncErrors.push({ reason: "Failed to add items: " + lineErr.message, data: txn.reference });');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed line error logging');
