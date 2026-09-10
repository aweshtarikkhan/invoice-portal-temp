const fs = require('fs');
let c = fs.readFileSync('src/pages/VendorsPage.tsx', 'utf8');

c = c.replace('let s = 0, e = 0;', 'let s = 0, e = 0; const failedRows: any[] = [];');
c = c.replace(
  'if (error) e++; else s++;',
  'if (error) { e++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else { s++; }'
);
c = c.replace('return { success: s, errors: e };', 'return { success: s, errors: e, failedRows };');

// Let's also fix display_name issue just in case
c = c.replace(
  'name: row.name,',
  'name: row.name,\n              display_name: row.name,'
);

fs.writeFileSync('src/pages/VendorsPage.tsx', c);
console.log('Fixed VendorsPage');
