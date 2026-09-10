const fs = require('fs');
let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');

// Normalize to LF for matching, then write back with CRLF
c = c.replace(/\r\n/g, '\n');

// Fix 1: GST decimal (0.18 -> 18), fix type:"gst" -> "simple", remove is_recoverable
c = c.replace(
  /const gstPct = parseFloat\(gRow\.tax_rate\) \|\| 0;/,
  `// Handle GST % — support both 18 (percent) and 0.18 (decimal fraction)
                  let rawGst = parseFloat(gRow.tax_rate) || 0;
                  const gstPct = rawGst > 0 && rawGst < 1 ? rawGst * 100 : rawGst;`
);
console.log('Fix 1a: decimal fraction fix');

c = c.replace('let taxId = null;', 'let taxId: string | null = null;');
console.log('Fix 1b: taxId type');

c = c.replace(`taxId = taxMap.get(gstPct);`, `taxId = taxMap.get(gstPct) || null;`);
console.log('Fix 1c: taxMap get with fallback');

c = c.replace(`                        type: "gst",
                        is_recoverable: true`, `                        type: "simple",`);
console.log('Fix 1d: type enum + remove is_recoverable');

c = c.replace(
  `amount: org?.gst_number ? itemAmount + taxAmount : itemAmount,`,
  `amount: gstPct > 0 ? itemAmount + taxAmount : itemAmount,`
);
console.log('Fix 1e: amount calculation');

// Fix 2: Wrap per-invoice in try/catch
c = c.replace(
  `          for (const [invNum, groupRows] of invoiceGroups.entries()) {\n            const row = groupRows[0];`,
  `          for (const [invNum, groupRows] of invoiceGroups.entries()) {\n            try {\n            const row = groupRows[0];`
);
console.log('Fix 2a: try block');

c = c.replace(
  `              if (lineItems.length > 0) {\n                 await supabase.from("invoice_lines").insert(lineItems);\n              }\n            }\n          }`,
  `              if (lineItems.length > 0) {\n                 await supabase.from("invoice_lines").insert(lineItems);\n              }\n            }\n            } catch (e: any) { console.error("Import row error:", invNum, e); errors++; }\n          }`
);
console.log('Fix 2b: catch block');

// Fix 3: Remove window.location.reload - let ImportDialog show results
c = c.replace(
  `          setTimeout(() => window.location.reload(), 3000);\n          return { success, errors };`,
  `          return { success, errors };`
);
console.log('Fix 3: removed reload');

// Fix 4: Better parseDate with fallback
c = c.replace(
  `            // Handle YYYY-MM-DD\n            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return d;\n            return d;`,
  `            // Handle YYYY-MM-DD\n            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) return d;\n            // Try native Date parse as fallback\n            try { const p = new Date(d); if (!isNaN(p.getTime())) return p.toISOString().split("T")[0]; } catch {}\n            return null;`
);
console.log('Fix 4: parseDate fallback');

// Fix 5: Error logging
c = c.replace(
  `            if (error || !newInvoice) { \n              errors++;`,
  `            if (error || !newInvoice) { \n              console.error("Invoice insert failed:", invNum, error?.message);\n              errors++;`
);
console.log('Fix 5: error logging');

// Convert back to CRLF
c = c.replace(/\n/g, '\r\n');

fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
console.log('\nDone! All fixes applied.');
