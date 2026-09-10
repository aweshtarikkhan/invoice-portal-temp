const fs = require('fs');
['src/pages/BillsPage.tsx', 'src/pages/EstimatesPage.tsx', 'src/pages/InvoicesPage.tsx', 'src/pages/PurchaseOrdersPage.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  // Literally replace the string "},\\n  {" 
  c = c.replace(/},\\[nr]  {/g, '},\n  {');
  // Just in case it's actually written as a literal \ and n
  c = c.replace(/},\\n  {/g, '},\n  {');
  fs.writeFileSync(f, c);
  console.log('Fixed', f);
});
