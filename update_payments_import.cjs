const fs = require('fs');

let c = fs.readFileSync('src/pages/PaymentsPage.tsx', 'utf8');

c = c.replace('let success = 0, errors = 0;', 'let success = 0, errors = 0; const failedRows: {row: any, reason: string}[] = [];');

c = c.replace('if (!name) { errors++; continue; }', 'if (!name) { errors++; failedRows.push({ row, reason: "Missing Customer Name" }); continue; }');

c = c.replace('if (cErr || !newClient) { errors++; continue; }', 'if (cErr || !newClient) { errors++; failedRows.push({ row, reason: "Failed to create Client" }); continue; }');

c = c.replace('if (error) { errors++; continue; }', 'if (error) { errors++; failedRows.push({ row, reason: error.message || "Failed to insert payment" }); continue; }');

c = c.replace('return { success, errors };', 'return { success, errors, failedRows };');

fs.writeFileSync('src/pages/PaymentsPage.tsx', c);
console.log('PaymentsPage updated');
