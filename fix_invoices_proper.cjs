const fs = require('fs');

let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');

c = c.replace('existingClients?.forEach(c => clientMap.set(c.display_name.toLowerCase(), c.id));', 
`existingClients?.forEach(c => clientMap.set(c.display_name.toLowerCase(), c.id));
          const { data: existingTaxes } = await supabase.from("tax_rates").select("id, rate").eq("org_id", org!.id);
          const taxMap = new Map();
          existingTaxes?.forEach(t => taxMap.set(Number(t.rate), t.id));`);

c = c.replace(/const itemAmount = gRow\.item_amount \? parseFloat\(gRow\.item_amount\) : \(qty \* rate\);([\s\S]*?)lineItems\.push\(\{([\s\S]*?)amount: itemAmount,([\s\S]*?)sort_order: i \+ 1\n\s*\}\);/g, 
`const itemAmount = gRow.item_amount ? parseFloat(gRow.item_amount) : (qty * rate);

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

                  lineItems.push({$2amount: org?.gst_number ? itemAmount + taxAmount : itemAmount,
                    tax_id: taxId,
                    tax_amount: taxAmount,$3sort_order: i + 1
                  });`);

c = c.replace('window.location.reload();', 'setTimeout(() => window.location.reload(), 2000);');

fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
console.log('Fixed InvoicesPage properly');
