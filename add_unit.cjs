const fs = require('fs');

const files = ['src/pages/BillsPage.tsx', 'src/pages/EstimatesPage.tsx', 'src/pages/InvoicesPage.tsx', 'src/pages/PurchaseOrdersPage.tsx'];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  
  // Add unit to import fields mapping
  if (!c.includes('{ key: "unit", label: "Unit" }')) {
    c = c.replace('{ key: "tax_rate", label: "GST %" },', '{ key: "tax_rate", label: "GST %" },\n  { key: "unit", label: "Unit" },');
  }

  // Add unit to invoice_lines insertion (for all of them)
  if (c.includes('tax_id: taxId,')) {
    c = c.replace('tax_id: taxId,', 'unit: gRow.unit || null,\n                    tax_id: taxId,');
  } else if (c.includes('tax_amount: taxAmount,')) {
     c = c.replace('tax_amount: taxAmount,', 'unit: gRow.unit || null,\n                    tax_amount: taxAmount,');
  }
  
  // For Bills, Estimates, POs where tax_id is not present but they have rate: rate
  if (!c.includes('unit: gRow.unit') && c.includes('rate: rate,')) {
    c = c.replace('rate: rate,', 'rate: rate,\n                    unit: gRow.unit || null,');
  }

  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
