const fs = require('fs');
let c = fs.readFileSync('src/pages/CampaignsPage.tsx', 'utf8');
c = c.replace('audience_type: form.audience_type,', 'audience_type: form.audience_type === "overdue" ? "overdue" : (form.audience_type.includes("custom") || form.audience_type === "prospects" ? "manual" : "all"),');
fs.writeFileSync('src/pages/CampaignsPage.tsx', c);
