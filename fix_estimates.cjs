const fs = require('fs');
let c = fs.readFileSync('src/pages/EstimatesPage.tsx', 'utf8');
c = c.replace('(row.client_name || "").toLowerCase()', 'String(row.client_name || "").toLowerCase()');
fs.writeFileSync('src/pages/EstimatesPage.tsx', c);
