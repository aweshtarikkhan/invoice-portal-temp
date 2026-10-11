import * as XLSX from "xlsx";

export async function parseTallyExcel(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsBinaryString(file);
  });
  const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error("No worksheet found");
  
  const worksheet = workbook.Sheets[firstSheetName];
  // Parse as a 2D array (array of arrays)
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const extractedRows: Record<string, any>[] = [];
  let currentInvoice: any = null;
  
  const getCellValue = (r: number, c: number) => {
    // XLSX uses 0-indexed rows and columns
    const row = rows[r - 1];
    return row ? row[c - 1] : null;
  };

  const getCellText = (r: number, c: number) => {
    const val = getCellValue(r, c);
    if (val === null || val === undefined) return "";
    return String(val).trim();
  };

  const colMap: Record<string, number> = {};
  
  const maxRows = Math.min(10, rows.length);
  const maxCols = rows.length > 0 ? Math.max(...rows.slice(0, 10).map(row => row.length)) : 0;
  
  for (let r = 1; r <= maxRows; r++) {
    for (let c = 1; c <= maxCols; c++) {
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

  const parseTallyDate = (d: any) => {
    if (!d) return "";
    if (d instanceof Date) {
      if (!isNaN(d.getTime())) return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
    return String(d);
  };

  for (let r = 1; r <= rows.length; r++) {
    const rawDate = colMap["date"] ? getCellValue(r, colMap["date"]) : getCellValue(r, 1);
    const dateText = parseTallyDate(rawDate);
    
    const particularsText = colMap["particulars"] ? getCellText(r, colMap["particulars"]) : getCellText(r, 2);
    const vchNo = colMap["voucher_no"] ? getCellText(r, colMap["voucher_no"]) : "";
    
    if (particularsText && particularsText.toLowerCase() !== "particulars") {
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
