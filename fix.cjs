const fs = require('fs');
let code = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

code = code.replace(
  'setDueDate(inv.due_date);\n        }\n        if (inv.shipping_address) {',
  'setDueDate(inv.due_date);\n        // removed extra brace\n        if (inv.shipping_address) {'
);

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', code, 'utf8');
console.log('Fixed extra brace');
