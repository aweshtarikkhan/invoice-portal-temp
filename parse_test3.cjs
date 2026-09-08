const ExcelJS = require('exceljs');
async function test() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("../Icon 8-9-26.xls");
  const ws = wb.worksheets[0];
  
  let extractedRows = [];
  let currentInvoice = null;

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
      const text = getCellText(r, c).toLowerCase().replace(/[\n\r]/g, " ").trim();
      if (!text) continue;
      if (text === "buyer") colMap["buyer"] = c;
      else if (text === "buyer address") colMap["buyer_address"] = c;
      else if (text === "consignee") colMap["consignee"] = c;
      else if (text === "consignee address") colMap["consignee_address"] = c;
      else if (text === "voucher no.") colMap["voucher_no"] = c;
      else if (text === "gstin/uin") colMap["gstin"] = c;
      else if (text === "pan no.") colMap["pan_no"] = c;
      else if (text === "quantity") colMap["qty"] = c;
      else if (text === "rate") colMap["rate"] = c;
      else if (text === "value") colMap["value"] = c;
      else if (text === "gross total") colMap["gross_total"] = c;
      else if (text === "output cgst") colMap["cgst"] = c;
      else if (text === "output sgst") colMap["sgst"] = c;
      else if (text === "date") colMap["date"] = c;
      else if (text === "particulars") colMap["particulars"] = c;
    }
  }

  const parseTallyDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
    return String(d);
  };

  for (let r = 1; r <= ws.rowCount; r++) {
    const rawDate = colMap["date"] ? getCellValue(r, colMap["date"]) : getCellValue(r, 1);
    const dateText = parseTallyDate(rawDate);
    const particularsText = colMap["particulars"] ? getCellText(r, colMap["particulars"]) : getCellText(r, 2);
    const vchNo = colMap["voucher_no"] ? getCellText(r, colMap["voucher_no"]) : "";
    
    if ((vchNo || (dateText && dateText !== "invalid date" && dateText.match(/^\d{4}-\d{2}-\d{2}$/))) && particularsText && particularsText.toLowerCase() !== "particulars") {
      if (vchNo && vchNo !== (currentInvoice ? currentInvoice.invoice_number : "")) {
        currentInvoice = {
          invoice_date: dateText,
          invoice_number: vchNo,
          client_name: colMap["buyer"] ? getCellText(r, colMap["buyer"]) : particularsText,
          client_address: colMap["buyer_address"] ? getCellText(r, colMap["buyer_address"]) : ""
        };
      } else if (currentInvoice && !vchNo) {
        const itemMatch = particularsText.match(/^(.*?)\s*\(HSN(.*?)\)/i);
        const itemName = itemMatch ? itemMatch[1].trim() : particularsText;
        const hsn = itemMatch ? itemMatch[2].trim() : "";
        extractedRows.push({ ...currentInvoice, item_name: itemName, item_hsn: hsn });
      }
    }
  }
  console.log("Extracted:", extractedRows.length, extractedRows.slice(0,2));
}
test();
