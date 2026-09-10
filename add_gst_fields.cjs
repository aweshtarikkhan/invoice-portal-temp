const fs = require('fs');

function addGstField(filePath, afterField) {
  let c = fs.readFileSync(filePath, 'utf8');
  if (!c.includes('{ key: "tax_rate", label: "GST %" }')) {
    c = c.replace(afterField, afterField + '\\n  { key: "tax_rate", label: "GST %" },');
    fs.writeFileSync(filePath, c);
    console.log('Added GST field to ' + filePath);
  }
}

addGstField('src/pages/InvoicesPage.tsx', '{ key: "item_amount", label: "Item Amount" },');
addGstField('src/pages/BillsPage.tsx', '{ key: "total", label: "Total Amount" },');
addGstField('src/pages/EstimatesPage.tsx', '{ key: "total", label: "Total Amount" },');
addGstField('src/pages/PurchaseOrdersPage.tsx', '{ key: "total", label: "Total Amount" },');

