const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

const regex = /lines\.push\(\{\s*\[isInvoice \? "invoice_id" : "bill_id"\]: newTxn\.id,\s*name: it\.name,\s*hsn_code: it\.hsn,\s*quantity: it\.qty,\s*rate: it\.rate,\s*amount: it\.amount,\s*sort_order: i \+ 1\s*\}\);/m;

const replacement = `const lineData: any = {
                [isInvoice ? "invoice_id" : "bill_id"]: newTxn.id,
                quantity: it.qty,
                rate: it.rate,
                amount: it.amount,
                sort_order: i + 1
              };
              if (isInvoice) {
                lineData.name = it.name;
                lineData.hsn_code = it.hsn;
              } else {
                lineData.description = it.name;
                lineData.hsn = it.hsn;
                lineData.org_id = org.id;
              }
              lines.push(lineData);`;

if (c.match(regex)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
  console.log('Fixed line mappings');
} else {
  console.log('Regex failed');
}
