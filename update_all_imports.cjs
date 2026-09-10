const fs = require('fs');

const pages = ['InvoicesPage.tsx', 'BillsPage.tsx', 'EstimatesPage.tsx', 'PurchaseOrdersPage.tsx', 'ClientsPage.tsx', 'ItemsPage.tsx', 'VendorsPage.tsx'];

for (const p of pages) {
  if (!fs.existsSync('src/pages/' + p)) continue;
  let c = fs.readFileSync('src/pages/' + p, 'utf8');
  
  if (c.includes('let success = 0, errors = 0;') && !c.includes('const failedRows: {row: any, reason: string}[] = [];')) {
    c = c.replace('let success = 0, errors = 0;', 'let success = 0, errors = 0; const failedRows: {row: any, reason: string}[] = [];');
    c = c.replace('return { success, errors };', 'return { success, errors, failedRows };');
    
    // Attempt some basic replacements
    c = c.replace(/if \(![a-zA-Z0-9_]+\) \{ errors\+\+; continue; \}/g, (match) => {
      return match.replace('errors++;', 'errors++; failedRows.push({ row, reason: "Missing required field" });');
    });
    
    c = c.replace(/if \(error\) \{ errors\+\+; continue; \}/g, 'if (error) { errors++; failedRows.push({ row, reason: error.message || "Failed to insert" }); continue; }');
    c = c.replace(/if \(itemError\) \{ errors\+\+; continue; \}/g, 'if (itemError) { errors++; failedRows.push({ row, reason: itemError.message || "Failed to insert item" }); continue; }');
    c = c.replace(/if \(lineErr\) \{ errors\+\+; continue; \}/g, 'if (lineErr) { errors++; failedRows.push({ row, reason: lineErr.message || "Failed to insert line" }); continue; }');

    fs.writeFileSync('src/pages/' + p, c);
    console.log(p, 'updated');
  }
}
