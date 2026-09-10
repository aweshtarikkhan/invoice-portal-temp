import ExcelJS from "exceljs";

export type TallySyncType = "debtors" | "creditors";

export interface ParsedTallyParty {
  partyName: string;
  transactions: ParsedTallyTransaction[];
}

export interface ParsedTallyTransaction {
  type: "invoice" | "bill" | "payment_received" | "payment_made";
  date: string;
  reference: string;
  amount: number;
  items: ParsedTallyItem[];
  narration?: string;
  dueDate?: string;
}

export interface ParsedTallyItem {
  name: string;
  hsn: string;
  qty: number;
  rate: number;
  amount: number;
}

export async function parseTallyOutstandingReport(file: File, type: TallySyncType): Promise<ParsedTallyParty[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet found");

  const parties: ParsedTallyParty[] = [];
  let currentParty: ParsedTallyParty | null = null;
  let currentTransaction: ParsedTallyTransaction | null = null;

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

  const parseDate = (d: any) => {
    if (!d) return "";
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
    return String(d);
  };

  for (let r = 1; r <= ws.rowCount; r++) {
    const col2 = getCellText(r, 2);
    const col3 = getCellText(r, 3);
    const col4 = getCellText(r, 4);

    // Skip headers
    if (col2 === "Date" || col2 === "Group :") continue;

    // Detect Party Name (usually empty in col 2, but has same value in col 4, 5, 6, 7)
    if (!col2 && !col3 && col4 && col4 !== "Amount" && col4 !== "Sales" && col4 !== "Purchase" && col4 !== "Receipt" && col4 !== "Payment") {
      // It's a party name!
      currentParty = {
        partyName: col4,
        transactions: []
      };
      parties.push(currentParty);
      currentTransaction = null;
      continue;
    }

    if (!currentParty) continue;

    // Detect Bill Summary row (Date in col 2, Ref in col 3, Opening in col 8)
    const isDate = col2.match(/^\d{4}-\d{2}-\d{2}/) || !isNaN(new Date(col2).getTime());
    
    // In Tally Outstanding, the Voucher detail row has Date in col 2, Date again in col 3, Voucher Type in col 4
    if (col4 === "Sales" || col4 === "Receipt" || col4 === "Purchase" || col4 === "Payment") {
      const vchType = col4;
      const ref = getCellText(r, 5); // Ref no is in col 5 usually for the voucher row
      const amount = parseFloat(getCellText(r, 6)) || 0;
      
      let mappedType: ParsedTallyTransaction["type"];
      if (vchType === "Sales" && type === "debtors") mappedType = "invoice";
      else if (vchType === "Receipt" && type === "debtors") mappedType = "payment_received";
      else if (vchType === "Purchase" && type === "creditors") mappedType = "bill";
      else if (vchType === "Payment" && type === "creditors") mappedType = "payment_made";
      else mappedType = type === "debtors" ? "invoice" : "bill"; // Fallback

      currentTransaction = {
        type: mappedType,
        date: parseDate(col2),
        reference: ref,
        amount: amount,
        items: []
      };
      currentParty.transactions.push(currentTransaction);
      continue;
    }

    // Detect Narration (usually in col 2, starting with "BEING" or "being" or just text, but no date format)
    if (currentTransaction && col2 && !isDate && !col4) {
      if (!currentTransaction.narration) currentTransaction.narration = col2;
      else currentTransaction.narration += " " + col2;
      continue;
    }

    // Detect Item Row (Item Name in col 4, Rate in col 6) for Sales/Purchase
    if (currentTransaction && (currentTransaction.type === "invoice" || currentTransaction.type === "bill")) {
      if (col2 && !isDate && col4) {
        // Col 2 might be Qty, Col 4 Item Name, Col 6 Amount/Rate
        const itemName = col4;
        const hsnMatch = itemName.match(/HSN\s*(\d+)/i);
        const hsn = hsnMatch ? hsnMatch[1] : "";
        
        let qty = 1;
        const qtyMatch = col2.match(/([\d\.]+)/);
        if (qtyMatch) qty = parseFloat(qtyMatch[1]);

        const rateOrAmount = parseFloat(getCellText(r, 6)) || 0;
        
        currentTransaction.items.push({
          name: itemName.replace(/\(HSN.*?\)/i, "").trim(),
          hsn,
          qty,
          rate: rateOrAmount, // Tally report shows total item amount here usually, or rate.
          amount: rateOrAmount
        });
      }
    }
    
    // Detect Bill Summary Due Date (Col 2 is date, Col 3 is string, Col 8 is amount, Col 10 is Due Date)
    if (isDate && col3 && col3 !== col2 && !currentTransaction) {
       // This is the bill summary row, we can just save the due date and wait for the voucher row to attach it
       // Actually, the voucher row comes immediately AFTER the summary row.
       // It's fine, we will just parse the voucher row.
    }
  }

  // Filter out empty parties
  return parties.filter(p => p.transactions.length > 0);
}
