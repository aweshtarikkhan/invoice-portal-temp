const fs = require('fs');

let c = fs.readFileSync('src/pages/VendorsPage.tsx', 'utf8');

c = c.replace(
  'address: row.address || null,',
  'billing_address: row.address ? { street: row.address } : null,'
);

fs.writeFileSync('src/pages/VendorsPage.tsx', c);
console.log('Fixed address column error in VendorsPage');
