const fs = require('fs');
let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');

const target = 'const invoiceGroups = new Map<string, any[]>();';
const replace = `const { data: existingTaxes } = await supabase.from("tax_rates").select("id, rate").eq("org_id", org!.id);
          const taxMap = new Map();
          existingTaxes?.forEach(t => taxMap.set(Number(t.rate), t.id));

          const invoiceGroups = new Map<string, any[]>();`;

c = c.replace(target, replace);
fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
console.log('taxMap added');
