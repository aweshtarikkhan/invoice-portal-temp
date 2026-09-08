const ExcelJS = require('exceljs');
async function test() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("../Icon 8-9-26.xls");
  const ws = wb.worksheets[0];

  const getCellValue = (r, c) => {
    const cell = ws.getCell(r, c);
    return cell && cell.master ? cell.master.value : (cell ? cell.value : null);
  };
  const getCellText = (r, c) => {
    const val = getCellValue(r, c);
    if (val === null || val === undefined) return "";
    if (typeof val === "object" && "richText" in val) {
      return val.richText.map((rt) => rt.text).join("");
    }
    return String(val).trim();
  };

  const colMap = {};
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const text = getCellText(r, c).toLowerCase().replace(/[\n\r]/g, " ");
      if (text) console.log(`Row ${r} Col ${c}: ${text}`);
      if (text.includes("buyer") && !text.includes("address")) colMap["buyer"] = c;
      if (text.includes("voucher no") || text.includes("vch no")) colMap["voucher_no"] = c;
      if (text.includes("date")) colMap["date"] = c;
      if (text.includes("particulars")) colMap["particulars"] = c;
    }
  }
  console.log("ColMap:", colMap);
}
test();
