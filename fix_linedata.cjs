const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('const lineData: any = { discount: 0, discount_type: "percentage", tax_amount: 0,', 'const lineData: any = {');
c = c.replace('                if (isInvoice) {', '                if (isInvoice) {\n                  lineData.discount = 0;\n                  lineData.discount_type = "percentage";\n                  lineData.tax_amount = 0;');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed lineData discount_type issue');
