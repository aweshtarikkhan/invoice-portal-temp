const fs = require('fs');

let c = fs.readFileSync('src/pages/LeadsPage.tsx', 'utf8');
c = c.replace('let success = 0, errors = 0;', 'let success = 0, errors = 0; const failedRows: any[] = [];');
c = c.replace('errors++;\n                continue;', 'errors++; failedRows.push({ row, reason: "Missing required field: Name" });\n                continue;');
c = c.replace('if (error) {\n              errors++;', 'if (error) {\n              errors++; failedRows.push({ row, reason: error.message || "Failed to insert" });');
c = c.replace('return { success, errors };', 'return { success, errors, failedRows };');
fs.writeFileSync('src/pages/LeadsPage.tsx', c);
console.log('Fixed Leads');
