const fs = require('fs');
let code = fs.readFileSync('src/pages/PurchaseOrderBuilderPage.tsx', 'utf8');

// 1. Fix the select query
code = code.replace(/from\("vendors"\)\.select\("id, display_name, gstin"\)/, 'from("vendors").select("id, display_name, gstin, email, phone")');

// 2. Fix the usage of v.name -> v.display_name
code = code.replace(/v\.name/g, 'v.display_name');

fs.writeFileSync('src/pages/PurchaseOrderBuilderPage.tsx', code);
console.log('Fixed vendor select in PO Builder');
