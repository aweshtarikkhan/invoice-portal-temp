const fs = require('fs');
let code = fs.readFileSync('src/store/feature-store.ts', 'utf8');

const target = '{ key: "activities", title: "Activities", description: "Track CRM activities", icon: "ClipboardList", url: "/activities" },';
const replacement = target + '\n        { key: "integrations", title: "Integrations & API", description: "Lead sources & webhooks", icon: "Link2", url: "/crm/integrations" },';

if (code.includes(target) && !code.includes('/crm/integrations')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/store/feature-store.ts', code);
  console.log("Patched feature-store.ts for CRM integrations");
}
