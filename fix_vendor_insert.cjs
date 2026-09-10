const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('await supabase.from("vendors").insert({ org_id: org.id, display_name: party.partyName })', 'await supabase.from("vendors").insert({ org_id: org.id, name: party.partyName, display_name: party.partyName })');

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed vendor name insert constraint');
