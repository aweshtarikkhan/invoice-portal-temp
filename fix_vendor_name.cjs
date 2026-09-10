const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('.ilike("vendor_name", party.partyName)', '.ilike("name", party.partyName)');
c = c.replace('insert({ org_id: org.id, vendor_name: party.partyName })', 'insert({ org_id: org.id, name: party.partyName })');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed vendor name column');
