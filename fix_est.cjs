const fs = require('fs');

let c = fs.readFileSync('src/pages/EstimatesPage.tsx', 'utf8');
c = c.replace('if (error) errors++; else success++;', 'if (error) { errors++; failedRows.push({ row, reason: error.message || "Failed to insert estimate" }); } else success++;');
fs.writeFileSync('src/pages/EstimatesPage.tsx', c);
console.log('Fixed Estimates');
