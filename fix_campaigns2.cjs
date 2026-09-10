const fs = require('fs');
let c = fs.readFileSync('src/pages/CampaignsPage.tsx', 'utf8');
c = c.replace('<TableCell className="text-xs">{c.audience_type}</TableCell>', '<TableCell className="text-xs capitalize">{c.audience_type.replace("_", " ")}</TableCell>');
fs.writeFileSync('src/pages/CampaignsPage.tsx', c);
