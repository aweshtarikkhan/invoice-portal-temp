const fs = require('fs');
let code = fs.readFileSync('src/pages/GrnBuilderPage.tsx', 'utf8');

// 1. Fix the select query if needed
code = code.replace(/from\("vendors"\)\.select\("id, display_name, gstin"\)/, 'from("vendors").select("id, display_name, gstin")');

// 2. Fix the usage of v.name -> v.display_name
code = code.replace(/v\.name/g, 'v.display_name');

fs.writeFileSync('src/pages/GrnBuilderPage.tsx', code);
console.log('Fixed vendor select in GRN Builder');
