const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace(/const lineData: any = \{/m, 'const lineData: any = { discount: 0, discount_type: "percentage", tax_amount: 0,');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed line defaults');
