const fs = require('fs');
let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');

// Fix 1: GST decimal fraction (0.18 -> 18) and fix type enum and remove is_recoverable
const oldGst = `                  const gstPct = parseFloat(gRow.tax_rate) || 0;
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

const newGst = `                  // Handle GST % — support both 18 (percent) and 0.18 (decimal fraction)
                  let rawGst = parseFloat(gRow.tax_rate) || 0;
                  const gstPct = rawGst > 0 && rawGst < 1 ? rawGst * 100 : rawGst;
                  let taxId: string | null = null;
                  let taxAmount = 0;
                  if (gstPct > 0) {
                    taxAmount = (itemAmount * gstPct) / 100;
                    if (taxMap.has(gstPct)) {
                      taxId = taxMap.get(gstPct) || null;
                    } else {
                      const { data: newTax } = await supabase.from("tax_rates").insert({
                        org_id: org!.id,
                        name: \`GST \${gstPct}%\`,
                        rate: gstPct,
                        type: "simple",
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
                    amount: gstPct > 0 ? itemAmount + taxAmount : itemAmount,
                    tax_id: taxId,
                    tax_amount: taxAmount,
                    sort_order: i + 1
                  });`;

if (c.includes(oldGst)) {
  c = c.replace(oldGst, newGst);
  console.log('Fix 1 applied: GST decimal, type enum, is_recoverable');
} else {
  console.log('Fix 1: target not found');
}

// Fix 2: Wrap per-invoice logic in try/catch
const oldForLoop = `          for (const [invNum, groupRows] of invoiceGroups.entries()) {
            const row = groupRows[0]; // Primary invoice data from the first row`;
const newForLoop = `          for (const [invNum, groupRows] of invoiceGroups.entries()) {
            try {
            const row = groupRows[0]; // Primary invoice data from the first row`;

if (c.includes(oldForLoop)) {
  c = c.replace(oldForLoop, newForLoop);
  console.log('Fix 2a applied: try block');
} else {
  console.log('Fix 2a: target not found');
}

// Close the try/catch before the closing of the for loop
const oldEndBlock = `              if (lineItems.length > 0) {
                 await supabase.from("invoice_lines").insert(lineItems);
              }
            }
          }`;
const newEndBlock = `              if (lineItems.length > 0) {
                 await supabase.from("invoice_lines").insert(lineItems);
              }
            }
            } catch (e: any) { console.error("Import row error:", invNum, e); errors++; }
          }`;

if (c.includes(oldEndBlock)) {
  c = c.replace(oldEndBlock, newEndBlock);
  console.log('Fix 2b applied: catch block');
} else {
  console.log('Fix 2b: target not found');
}

// Fix 3: Wrap entire onImport in try/catch and remove window.location.reload
const oldReload = `          // Update opening_balance for each client based on their total balance_due
          const uniqueClientIds = Array.from(new Set(clientMap.values()));
          for (const cid of uniqueClientIds) {
            const { data: cInvoices } = await supabase.from("invoices").select("balance_due").eq("client_id", cid);
            const totalDue = (cInvoices || []).reduce((s: number, inv: any) => s + Number(inv.balance_due), 0);
            await supabase.from("clients").update({ opening_balance: totalDue }).eq("id", cid);
          }
          setTimeout(() => window.location.reload(), 3000);
          return { success, errors };`;

const newReload = `          // Update opening_balance for each client based on their total balance_due
          const uniqueClientIds = Array.from(new Set(clientMap.values()));
          for (const cid of uniqueClientIds) {
            const { data: cInvoices } = await supabase.from("invoices").select("balance_due").eq("client_id", cid);
            const totalDue = (cInvoices || []).reduce((s: number, inv: any) => s + Number(inv.balance_due), 0);
            await supabase.from("clients").update({ opening_balance: totalDue }).eq("id", cid);
          }
          return { success, errors };`;

if (c.includes(oldReload)) {
  c = c.replace(oldReload, newReload);
  console.log('Fix 3 applied: removed reload, will let ImportDialog show results');
} else {
  console.log('Fix 3: target not found');
}

// Fix 4: Better parseDate - handle fallback for unparseable strings
const oldParseDate = `          const parseDate = (val: any) => {
            if (!val) return null;
            const d = String(val).trim();
            // Handle DD-MM-YYYY or DD/MM/YYYY
            const m = d.match(/^(\\d{1,2})[-\\/](\\d{1,2})[-\\/](\\d{4})$/);
            if (m) return \`\${m[3]}-\${m[2].padStart(2,'0')}-\${m[1].padStart(2,'0')}\`;
            // Handle YYYY-MM-DD
            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return d;
            return d;
          };`;

const newParseDate = `          const parseDate = (val: any) => {
            if (!val) return null;
            const d = String(val).trim();
            if (!d) return null;
            // Handle YYYY-MM-DD
            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return d;
            // Handle DD-MM-YYYY or DD/MM/YYYY
            const m = d.match(/^(\\d{1,2})[-\\/](\\d{1,2})[-\\/](\\d{4})$/);
            if (m) return \`\${m[3]}-\${m[2].padStart(2,'0')}-\${m[1].padStart(2,'0')}\`;
            // Try native Date parse as fallback
            try { const p = new Date(d); if (!isNaN(p.getTime())) return p.toISOString().split("T")[0]; } catch {}
            return null;
          };`;

if (c.includes(oldParseDate)) {
  c = c.replace(oldParseDate, newParseDate);
  console.log('Fix 4 applied: better parseDate with fallback');
} else {
  console.log('Fix 4: target not found');
}

// Fix 5: Add error logging to invoice insert
const oldInvErr = `            if (error || !newInvoice) { 
              errors++; 
            } else {`;
const newInvErr = `            if (error || !newInvoice) { 
              console.error("Invoice insert failed:", invNum, error?.message);
              errors++; 
            } else {`;

if (c.includes(oldInvErr)) {
  c = c.replace(oldInvErr, newInvErr);
  console.log('Fix 5 applied: error logging');
} else {
  console.log('Fix 5: target not found');
}

fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
console.log('\nAll fixes applied successfully!');
