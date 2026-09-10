// Full simulation of the import process with detailed error logging
const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, '..', 'invoice_template_filled_with_gst_percent.xlsx'));
  const ws = wb.worksheets[0];
  
  // Step 1: Parse headers (same as ImportDialog)
  const headerRow = ws.getRow(1).values;
  const keys = [];
  for (let i = 1; i < headerRow.length; i++) {
    const v = headerRow[i];
    keys.push(v == null ? `Column ${i}` : String(v));
  }
  
  // Step 2: Parse rows (same as ImportDialog with Date fix)
  const rawRows = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const rowVals = ws.getRow(r).values;
    const obj = {};
    let hasValue = false;
    keys.forEach((k, idx) => {
      const cell = rowVals[idx + 1];
      let val = cell && typeof cell === "object" && "text" in cell ? cell.text : cell;
      if (val instanceof Date) {
        if (!isNaN(val.getTime())) {
          val = new Date(val.getTime() - val.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        } else {
          val = "";
        }
      }
      if (val !== undefined && val !== null && val !== "") hasValue = true;
      obj[k] = val ?? "";
    });
    if (hasValue) rawRows.push(obj);
  }
  
  console.log(`Raw rows parsed: ${rawRows.length}`);
  
  // Step 3: Auto-mapping (same as ImportDialog)
  const invoiceImportFields = [
    { key: "invoice_number", label: "Invoice Number", required: true },
    { key: "client_name", label: "Customer Name", required: true },
    { key: "item_name", label: "Item Name" },
    { key: "item_hsn", label: "Item HSN Code" },
    { key: "qty", label: "Quantity" },
    { key: "rate", label: "Rate" },
    { key: "item_amount", label: "Item Amount" },
    { key: "tax_rate", label: "GST %" },
    { key: "client_gst", label: "Client GST Number" },
    { key: "pan_no", label: "Client PAN Number" },
    { key: "client_address", label: "Client Address" },
    { key: "shipping_name", label: "Shipping Name" },
    { key: "shipping_address", label: "Shipping Address" },
    { key: "invoice_date", label: "Invoice Date" },
    { key: "issue_date", label: "Issued Date" },
    { key: "due_date", label: "Due Date" },
    { key: "total", label: "Total" },
    { key: "balance_due", label: "Balance" },
    { key: "status", label: "Status" },
    { key: "reference_number", label: "Reference Number" },
    { key: "currency_code", label: "Currency Code" },
  ];
  
  const norm = (s) => String(s || "").toLowerCase().replace(/[_\-\s]/g, "");
  const mapping = {};
  invoiceImportFields.forEach((f) => {
    const match = keys.find((h) => {
      return norm(h) === norm(f.key) || norm(h) === norm(f.label);
    });
    if (match) mapping[f.key] = match;
  });
  
  console.log('\n=== AUTO MAPPING RESULT ===');
  invoiceImportFields.forEach(f => {
    const mapped = mapping[f.key];
    console.log(`  ${f.key} -> ${mapped ? `"${mapped}"` : '(NOT MAPPED)'} ${f.required ? '(REQUIRED)' : ''}`);
  });
  
  // Step 4: Apply mapping to rows
  const mappedRows = rawRows.map((row) => {
    const mapped = {};
    invoiceImportFields.forEach((f) => {
      const src = mapping[f.key];
      if (src) mapped[f.key] = row[src];
    });
    return mapped;
  });
  
  // Step 5: Filter rows with at least one truthy value  
  const filteredRows = mappedRows.filter((r) => Object.values(r).some(Boolean));
  console.log(`\nFiltered rows (with at least one value): ${filteredRows.length}`);
  
  if (filteredRows.length === 0) {
    console.log('\n!!! ALL ROWS FILTERED OUT - THIS IS THE BUG !!!');
    console.log('\nFirst 3 mapped rows BEFORE filter:');
    mappedRows.slice(0, 3).forEach((r, i) => {
      console.log(`Row ${i+1}:`, JSON.stringify(r));
      console.log('  Values:', Object.values(r));
      console.log('  Some Boolean:', Object.values(r).some(Boolean));
    });
  } else {
    console.log('\nFirst mapped row:', JSON.stringify(filteredRows[0], null, 2));
    
    // Step 6: Simulate the grouping
    const invoiceGroups = new Map();
    for (const row of filteredRows) {
      const num = String(row.invoice_number || "").trim();
      if (!num) { console.log('WARNING: Empty invoice_number in row'); continue; }
      if (!invoiceGroups.has(num)) invoiceGroups.set(num, []);
      invoiceGroups.get(num).push(row);
    }
    console.log(`\nInvoice groups: ${invoiceGroups.size}`);
    
    // Step 7: Check parseDate for first row  
    const row = filteredRows[0];
    const parseDate = (val) => {
      if (!val) return null;
      const d = String(val).trim();
      const m = d.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      return d;
    };
    
    console.log('\n=== DATE PARSING ===');
    console.log('issue_date raw:', row.issue_date, '-> parsed:', parseDate(row.issue_date));
    console.log('invoice_date raw:', row.invoice_date, '-> parsed:', parseDate(row.invoice_date));
    console.log('due_date raw:', row.due_date, '-> parsed:', parseDate(row.due_date));
    
    const issueDate = parseDate(row.issue_date) || parseDate(row.invoice_date) || new Date().toISOString().split("T")[0];
    console.log('Final issueDate:', issueDate);
    
    // Step 8: Check status logic
    const total = parseFloat(row.total) || 0;
    const balanceDue = row.balance_due !== undefined && row.balance_due !== "" ? parseFloat(row.balance_due) : total;
    const status = balanceDue === 0 && total > 0 ? "paid" : (["draft","sent","paid","overdue","void","partial"].includes(row.status) ? row.status : "draft");
    console.log('\n=== STATUS ===');
    console.log('total:', total, 'balanceDue:', balanceDue, 'status:', status);
    
    // Step 9: Check what would be inserted
    console.log('\n=== INVOICE INSERT PAYLOAD (would be) ===');
    console.log({
      invoice_number: String(row.invoice_number).trim(),
      issue_date: issueDate,
      due_date: parseDate(row.due_date) || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      total,
      subtotal: total,
      balance_due: balanceDue,
      status,
      currency_code: row.currency_code || "INR",
    });
    
    // Step 10: Check GST
    console.log('\n=== GST ===');
    console.log('tax_rate raw:', row.tax_rate, 'type:', typeof row.tax_rate);
    console.log('parseFloat(tax_rate):', parseFloat(row.tax_rate));
    const gstPct = parseFloat(row.tax_rate) || 0;
    const itemAmount = parseFloat(row.item_amount) || 0;
    console.log('gstPct:', gstPct, 'itemAmount:', itemAmount);
    console.log('taxAmount (pct/100):', (itemAmount * gstPct) / 100);
    if (gstPct < 1) {
      console.log('WARNING: GST is a decimal fraction (0.18 = 18%). Should multiply by 100 first!');
      console.log('taxAmount (corrected):', itemAmount * gstPct);
    }
  }
}

main().catch(console.error);
