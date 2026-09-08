import ExcelJS from "exceljs";

export async function parseTallyExcel(file: File) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet found");

  const extractedRows: Record<string, any>[] = [];
  let currentInvoice: any = null;
  
  const getCellValue = (r: number, c: number) => {
    const cell = ws.getCell(r, c);
    return cell && cell.master ? cell.master.value : (cell ? cell.value : null);
  };

  const getCellText = (r: number, c: number) => {
    const val = getCellValue(r, c);
    if (val === null || val === undefined) return "";
    if (typeof val === "object" && "richText" in (val as any)) {
      return (val as any).richText.map((rt: any) => rt.text).join("");
    }
    return String(val).trim();
  };

  const colMap: Record<string, number> = {};
  
  for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
    for (let c = 1; c <= ws.columnCount; c++) {
      const text = getCellText(r, c).toLowerCase().replace(/[\n\r]/g, " ");
      if (text.includes("buyer") && !text.includes("address")) colMap["buyer"] = c;
      if (text.includes("buyer address")) colMap["buyer_address"] = c;
      if (text.includes("consignee") && !text.includes("address")) colMap["consignee"] = c;
      if (text.includes("consignee address")) colMap["consignee_address"] = c;
      if (text.includes("voucher no") || text.includes("vch no")) colMap["voucher_no"] = c;
      if (text.includes("gstin/uin")) colMap["gstin"] = c;
      if (text.includes("pan no")) colMap["pan_no"] = c;
      if (text.includes("quantity") || text.includes("qty")) colMap["qty"] = c;
      if (text.includes("rate")) colMap["rate"] = c;
      if (text.includes("value") || text.includes("gross total") || text.includes("amount")) colMap["value"] = c;
      if (text.includes("output cgst")) colMap["cgst"] = c;
      if (text.includes("output sgst")) colMap["sgst"] = c;
      if (text.includes("date")) colMap["date"] = c;
      if (text.includes("particulars")) colMap["particulars"] = c;
    }
  }

  for (let r = 1; r <= ws.rowCount; r++) {
    const dateText = colMap["date"] ? getCellText(r, colMap["date"]) : getCellText(r, 1);
    const particularsText = colMap["particulars"] ? getCellText(r, colMap["particulars"]) : getCellText(r, 2);
    
    const vchNo = colMap["voucher_no"] ? getCellText(r, colMap["voucher_no"]) : "";
    
    // An invoice row usually has a Date and a Voucher No, or at least a date that looks like a date
    if ((vchNo || dateText.match(/^\d{2}-[a-zA-Z]{3}-\d{2,4}$/)) && particularsText) {
      // Might be a new invoice OR an item. Usually item rows don't have voucher no.
      if (vchNo && vchNo !== currentInvoice?.invoice_number) {
        const buyer = colMap["buyer"] ? getCellText(r, colMap["buyer"]) : particularsText;
        const buyerAddress = colMap["buyer_address"] ? getCellText(r, colMap["buyer_address"]) : "";
        const consignee = colMap["consignee"] ? getCellText(r, colMap["consignee"]) : "";
        const consigneeAddress = colMap["consignee_address"] ? getCellText(r, colMap["consignee_address"]) : "";
        const gstin = colMap["gstin"] ? getCellText(r, colMap["gstin"]) : "";
        const pan = colMap["pan_no"] ? getCellText(r, colMap["pan_no"]) : "";
        
        currentInvoice = {
          invoice_date: dateText,
          invoice_number: vchNo,
          client_name: buyer,
          client_address: buyerAddress,
          shipping_name: consignee,
          shipping_address: consigneeAddress,
          client_gst: gstin,
          pan_no: pan,
          status: "sent"
        };
      } else if (currentInvoice && !vchNo) {
        // It's an item under the current invoice
        const itemMatch = particularsText.match(/^(.*?)\s*\(HSN(.*?)\)/i);
        const itemName = itemMatch ? itemMatch[1].trim() : particularsText;
        const hsn = itemMatch ? itemMatch[2].trim() : "";
        
        const qtyText = colMap["qty"] ? getCellText(r, colMap["qty"]) : "";
        let qty = 1;
        if (qtyText) {
          const qm = qtyText.match(/([\d\.]+)/);
          if (qm) qty = parseFloat(qm[1]);
          else qty = parseFloat(qtyText) || 1;
        }
        
        const rate = colMap["rate"] ? parseFloat(getCellText(r, colMap["rate"])) || 0 : 0;
        const value = colMap["value"] ? parseFloat(getCellText(r, colMap["value"])) || 0 : (qty * rate);
        
        extractedRows.push({
          ...currentInvoice,
          item_name: itemName,
          item_hsn: hsn,
          qty: String(qty),
          rate: String(rate),
          item_amount: String(value)
        });
      }
    }
  }

  return extractedRows;
}
