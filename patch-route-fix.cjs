const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = '<Route path="/leads" element={<LeadsPage />} />';
const replacement = '<Route path="/crm/integrations" element={<CrmIntegrationsPage />} />\n                  ' + target;

if (code.includes(target) && !code.includes('/crm/integrations')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched route successfully");
} else {
  console.log("Could not find target or already patched");
}
