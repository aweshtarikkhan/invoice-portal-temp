const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace(/if\s*\(isInvoice\)\s*\{\s*lineData\.name/m, 'if (isInvoice) {\n                  lineData.discount = 0;\n                  lineData.discount_type = "percentage";\n                  lineData.tax_amount = 0;\n                  lineData.name');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed lineData again');
