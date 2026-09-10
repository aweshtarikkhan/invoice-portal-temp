const fs = require('fs');
let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');
c = c.replace('(row.invoice_number || "").trim()', 'String(row.invoice_number || "").trim()');
c = c.replace('(row.client_name || "").trim()', 'String(row.client_name || "").trim()');
fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
