const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace(
  'const { data: newClient } = await supabase.from("clients").insert({ org_id: org.id, display_name: party.partyName }).select("id").single();\n            if (newClient) {\n              partyId = newClient.id;\n              partiesAdded++;\n            }',
  'const { data: newClient, error: clientErr } = await supabase.from("clients").insert({ org_id: org.id, display_name: party.partyName }).select("id").single();\n            if (clientErr) { syncErrors.push({ reason: clientErr.message, data: party.partyName }); }\n            if (newClient) {\n              partyId = newClient.id;\n              partiesAdded++;\n            }'
);

c = c.replace(
  'const { data: newVendor } = await supabase.from("vendors").insert({ org_id: org.id, display_name: party.partyName }).select("id").single();\n            if (newVendor) {\n              partyId = newVendor.id;\n              partiesAdded++;\n            }',
  'const { data: newVendor, error: vendorErr } = await supabase.from("vendors").insert({ org_id: org.id, display_name: party.partyName }).select("id").single();\n            if (vendorErr) { syncErrors.push({ reason: vendorErr.message, data: party.partyName }); }\n            if (newVendor) {\n              partyId = newVendor.id;\n              partiesAdded++;\n            }'
);

fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed TallySyncPage to capture party errors');
