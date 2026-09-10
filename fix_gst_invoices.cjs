const fs = require('fs');

let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');

// 1. Fetch tax_rates
const fetchTarget = `const clientMap = new Map<string, string>();
          existingClients?.forEach(c => clientMap.set(c.display_name.toLowerCase(), c.id));`;

const fetchReplacement = `const clientMap = new Map<string, string>();
          existingClients?.forEach(c => clientMap.set(c.display_name.toLowerCase(), c.id));
          const { data: existingTaxes } = await supabase.from("tax_rates").select("id, rate").eq("org_id", org!.id);
          const taxMap = new Map<number, string>();
          existingTaxes?.forEach(t => taxMap.set(Number(t.rate), t.id));`;

c = c.replace(fetchTarget, fetchReplacement);

// 2. Handle GST in lineItems
const lineTarget = `                  const itemAmount = gRow.item_amount ? parseFloat(gRow.item_amount) : (qty * rate);

                  lineItems.push({
                    invoice_id: newInvoice.id,
                    name: gRow.item_name,
                    hsn_code: gRow.item_hsn || null,
                    quantity: qty,
                    rate: rate,
                    amount: itemAmount,
                    sort_order: i + 1
                  });`;

const lineReplacement = `                  const itemAmount = gRow.item_amount ? parseFloat(gRow.item_amount) : (qty * rate);
                  
                  const gstPct = parseFloat(gRow.tax_rate) || 0;
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

c = c.replace(lineTarget, lineReplacement);
fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
console.log('Fixed GST logic in InvoicesPage');
