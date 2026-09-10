const fs = require('fs');

function fix(file) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');

  // Invoices
  c = c.replace('if (cErr || !newClient) { errors++; continue; }', 'if (cErr || !newClient) { errors++; failedRows.push({ row, reason: "Failed to create client" }); continue; }');
  c = c.replace('} catch (e: any) { console.error("Import row error:", invNum, e); errors++; }', '} catch (e: any) { console.error("Import row error:", invNum, e); errors++; failedRows.push({ row, reason: e.message || "Unknown error" }); }');
  
  // Bills
  c = c.replace('if (vErr || !newVendor) { errors++; continue; }', 'if (vErr || !newVendor) { errors++; failedRows.push({ row, reason: "Failed to create vendor" }); continue; }');
  
  // Estimates
  c = c.replace('if (!name) { errors++; failedRows.push({ row, reason: "Missing required field" }); continue; }', 'if (!name) { errors++; failedRows.push({ row, reason: "Missing required field (Client Name)" }); continue; }');
  c = c.replace('} catch (e: any) { console.error("Import row error:", estNum, e); errors++; }', '} catch (e: any) { console.error("Import row error:", estNum, e); errors++; failedRows.push({ row, reason: e.message || "Unknown error" }); }');

  fs.writeFileSync(file, c);
}

fix('src/pages/InvoicesPage.tsx');
fix('src/pages/BillsPage.tsx');
fix('src/pages/EstimatesPage.tsx');
fix('src/pages/PurchaseOrdersPage.tsx');

console.log('Fixed missing pushes');
