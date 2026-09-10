const ExcelJS = require('exceljs');
const path = require('path');

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, '..', 'invoice_template_filled_with_gst_percent.xlsx'));
  const ws = wb.worksheets[0];
  
  console.log('Sheet name:', ws.name);
  console.log('Row count:', ws.rowCount);
  console.log('Column count:', ws.columnCount);
  console.log('');
  
  // Print headers (row 1)
  const headerRow = ws.getRow(1).values;
  console.log('=== HEADERS (Row 1) ===');
  for (let i = 1; i < headerRow.length; i++) {
    const v = headerRow[i];
    console.log(`  Col ${i}: "${v}" (type: ${typeof v})`);
  }
  
  // Print first 5 data rows
  console.log('\n=== FIRST 5 DATA ROWS ===');
  for (let r = 2; r <= Math.min(ws.rowCount, 6); r++) {
    const rowVals = ws.getRow(r).values;
    console.log(`\nRow ${r}:`);
    for (let i = 1; i < headerRow.length; i++) {
      const cell = rowVals[i];
      let val = cell && typeof cell === "object" && "text" in cell ? cell.text : cell;
      const cellType = cell instanceof Date ? 'Date' : typeof cell;
      console.log(`  ${headerRow[i]}: "${val}" (raw type: ${cellType}, instanceof Date: ${cell instanceof Date})`);
    }
  }
  
  // Now simulate what the import mapping would do
  console.log('\n=== SIMULATING IMPORT MAPPING ===');
  const keys = [];
  for (let i = 1; i < headerRow.length; i++) {
    const v = headerRow[i];
    keys.push(v == null ? `Column ${i}` : String(v));
  }
  console.log('Parsed keys:', keys);
  
  // Parse all rows like ImportDialog does
  const rows = [];
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
    if (hasValue) rows.push(obj);
  }
  
  console.log(`Total parsed rows: ${rows.length}`);
  console.log('\nFirst 3 parsed rows:');
  rows.slice(0, 3).forEach((row, i) => {
    console.log(`\nRow ${i + 1}:`, JSON.stringify(row, null, 2));
  });
  
  // Check what fields are available for mapping
  console.log('\n=== AVAILABLE COLUMN HEADERS FOR MAPPING ===');
  keys.forEach(k => console.log(`  - "${k}"`));
}

main().catch(console.error);
