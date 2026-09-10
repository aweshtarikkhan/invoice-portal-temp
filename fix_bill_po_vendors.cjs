const fs = require('fs');

function fixBills() {
  let c = fs.readFileSync('src/pages/BillsPage.tsx', 'utf8');

  const onImportStart = 'onImport={async (rows) => {\n            let s = 0, e = 0; const failedRows: any[] = [];';
  const logic = `
            const { data: existingVendors } = await supabase.from("vendors").select("id, display_name").eq("org_id", org!.id);
            const vendorMap = new Map<string, string>();
            existingVendors?.forEach(v => vendorMap.set(String(v.display_name).toLowerCase(), v.id));

            for (const row of rows) {
              const vName = row.vendor_name;
              if (!vName) { e++; failedRows.push({ row, reason: "Missing Vendor Name" }); continue; }
              
              let vendorId = vendorMap.get(String(vName).toLowerCase());
              if (!vendorId) {
                const { data: newV, error: vErr } = await supabase.from("vendors").insert({ org_id: org!.id, name: vName, display_name: vName }).select("id").single();
                if (vErr || !newV) { e++; failedRows.push({ row, reason: "Failed to create vendor" }); continue; }
                vendorId = newV.id;
                vendorMap.set(String(vName).toLowerCase(), vendorId);
              }

              const { error } = await supabase.from("bills").insert({
                org_id: org?.id,
                vendor_id: vendorId,
                bill_number: row.bill_number,
                total: Number(row.total) || 0,
                status: normalizeBillStatus(row.status),
                bill_date: row.bill_date || new Date().toISOString(),
                due_date: row.due_date || new Date().toISOString()
              });
              if (error) { e++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else { s++; }
            }
            load();
            return { success: s, errors: e, failedRows };
  `;
  
  c = c.replace(/onImport=\{async \(rows\) => \{[\s\S]*?return \{ success: s, errors: e, failedRows \};\n          \}\}/, 'onImport={async (rows) => {' + logic + '\n          }}');
  fs.writeFileSync('src/pages/BillsPage.tsx', c);
  console.log('Fixed BillsPage');
}

function fixPOs() {
  let c = fs.readFileSync('src/pages/PurchaseOrdersPage.tsx', 'utf8');

  const logic = `
            let s = 0, e = 0; const failedRows: any[] = [];
            const { data: existingVendors } = await supabase.from("vendors").select("id, display_name").eq("org_id", org!.id);
            const vendorMap = new Map<string, string>();
            existingVendors?.forEach(v => vendorMap.set(String(v.display_name).toLowerCase(), v.id));

            for (const row of rows) {
              const vName = row.vendor_name;
              if (!vName) { e++; failedRows.push({ row, reason: "Missing Vendor Name" }); continue; }
              
              let vendorId = vendorMap.get(String(vName).toLowerCase());
              if (!vendorId) {
                const { data: newV, error: vErr } = await supabase.from("vendors").insert({ org_id: org!.id, name: vName, display_name: vName }).select("id").single();
                if (vErr || !newV) { e++; failedRows.push({ row, reason: "Failed to create vendor" }); continue; }
                vendorId = newV.id;
                vendorMap.set(String(vName).toLowerCase(), vendorId);
              }

              const { error } = await supabase.from("purchase_orders").insert({
                org_id: org?.id,
                vendor_id: vendorId,
                po_number: row.po_number,
                total: Number(row.total) || 0,
                status: normalizePOStatus(row.status),
                po_date: row.po_date || new Date().toISOString()
              });
              if (error) { e++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else { s++; }
            }
            load();
            return { success: s, errors: e, failedRows };
  `;
  c = c.replace(/let s = 0, e = 0; const failedRows: any\[\] = \[\];[\s\S]*?return \{ success: s, errors: e, failedRows \};/, logic.trim());
  fs.writeFileSync('src/pages/PurchaseOrdersPage.tsx', c);
  console.log('Fixed PurchaseOrdersPage');
}

fixBills();
fixPOs();
