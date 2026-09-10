const fs = require('fs');
let content = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');

// 1. Add taxMap to the start of onImport
const mapSearch = `const clientMap = new Map<string, string>();
          existingClients?.forEach(c => clientMap.set(c.display_name.toLowerCase(), c.id));`;
const mapReplace = mapSearch + `
          const { data: existingTaxes } = await supabase.from("tax_rates").select("id, rate").eq("org_id", org!.id);
          const taxMap = new Map();
          existingTaxes?.forEach(t => taxMap.set(Number(t.rate), t.id));`;

if (content.includes(mapSearch)) {
    content = content.replace(mapSearch, mapReplace);
}

// 2. Add GST to line items
// Let's use string split/join to replace precisely
const parts = content.split('const itemAmount = gRow.item_amount ? parseFloat(gRow.item_amount) : (qty * rate);');

if (parts.length === 2) {
    const after = parts[1];
    const pushStart = after.indexOf('lineItems.push({');
    if (pushStart > -1) {
        const pushEnd = after.indexOf('});', pushStart);
        if (pushEnd > -1) {
            const pushContent = after.substring(pushStart, pushEnd + 3);
            
            const newPushContent = `const gstPct = parseFloat(gRow.tax_rate) || 0;
                  let taxId = null;
                  let taxAmount = 0;
                  if (gstPct > 0) {
                    taxAmount = (itemAmount * gstPct) / 100;
                    if (taxMap.has(gstPct)) {
                      taxId = taxMap.get(gstPct);
                    } else {
                      const { data: newTax } = await supabase.from("tax_rates").insert({
                        org_id: org!.id,
                        name: \`GST \${gstPct}%\`,
                        rate: gstPct,
                        type: "gst",
                        is_recoverable: true
                      }).select("id").single();
                      if (newTax) {
                        taxId = newTax.id;
                        taxMap.set(gstPct, taxId);
                      }
                    }
                  }

                  lineItems.push({
                    invoice_id: newInvoice.id,
                    name: gRow.item_name,
                    hsn_code: gRow.item_hsn || null,
                    quantity: qty,
                    rate: rate,
                    amount: org?.gst_number ? itemAmount + taxAmount : itemAmount,
                    tax_id: taxId,
                    tax_amount: taxAmount,
                    sort_order: i + 1
                  });`;
            
            content = parts[0] + 'const itemAmount = gRow.item_amount ? parseFloat(gRow.item_amount) : (qty * rate);\n\n                  ' + newPushContent + after.substring(pushEnd + 3);
        }
    }
}

// 3. Replace window.location.reload()
content = content.replace('window.location.reload();', 'setTimeout(() => window.location.reload(), 3000);');

fs.writeFileSync('src/pages/InvoicesPage.tsx', content);
console.log('Fixed InvoicesPage perfectly');
