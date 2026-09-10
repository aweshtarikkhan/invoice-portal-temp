const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace('let s = 0, e = 0;', 'let s = 0, e = 0; const failedRows: any[] = [];');
  c = c.replace(
    'if (error) e++; else s++;',
    'if (error) { e++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else { s++; }'
  );
  c = c.replace('return { success: s, errors: e };', 'return { success: s, errors: e, failedRows };');
  fs.writeFileSync(file, c);
  console.log('Fixed', file);
}

fix('src/pages/BillsPage.tsx');
fix('src/pages/PurchaseOrdersPage.tsx');
