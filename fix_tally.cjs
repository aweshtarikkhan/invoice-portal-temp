const fs = require('fs');
let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

c = c.replace('const { org } = useAppStore();', 'const org = useAppStore((s) => s.organization);');
c = c.replace('if (!parsedData || !org || !syncType) return;', 'if (!parsedData || !org || !syncType) { console.error("Missing data to sync", { parsedData: !!parsedData, org: !!org, syncType }); return; }');

// Also fix the bills bug while I'm at it
c = c.replace(
  'const { data: existingTxn } = await supabase.from(table).select("id").eq("org_id", org.id).eq("invoice_number", txn.reference).maybeSingle();',
  'const { data: existingTxn } = await supabase.from(table).select("id").eq("org_id", org.id).eq(isInvoice ? "invoice_number" : "bill_number", txn.reference).maybeSingle();'
);

c = c.replace(
  'invoice_number: txn.reference,',
  '...(isInvoice ? { invoice_number: txn.reference } : { bill_number: txn.reference }),'
);


fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
console.log('Fixed TallySyncPage');
