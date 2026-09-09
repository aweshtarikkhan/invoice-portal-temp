const fs = require('fs');

const files = [
  'src/pages/InvoiceBuilderPage.tsx',
  'src/pages/EstimateBuilderPage.tsx',
  'src/pages/BillBuilderPage.tsx',
  'src/pages/CreditNoteBuilderPage.tsx',
  'src/pages/PurchaseOrderBuilderPage.tsx',
];

const target1 = `onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}`;
const replace1 = `onChange={(e) => {
                    let val = parseFloat(e.target.value) || 0;
                    if (discountType === "percentage" && val > 100) val = 100;
                    setDiscount(val);
                  }}`;

const target2 = `onValueChange={(v) => setDiscountType(v as any)}`;
const replace2 = `onValueChange={(v) => {
                    setDiscountType(v as any);
                    if (v === "percentage" && discount > 100) setDiscount(100);
                  }}`;

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    
    if (content.includes(target1)) {
      content = content.replace(target1, replace1);
      changed = true;
    }
    
    if (content.includes(target2)) {
      content = content.replace(target2, replace2);
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(f, content);
      console.log('Updated ' + f);
    } else {
      console.log('Targets not found or already patched in ' + f);
    }
  } catch (err) {
    console.log('Error reading ' + f);
  }
});
