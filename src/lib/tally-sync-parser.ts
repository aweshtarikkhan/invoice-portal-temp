import * as XLSX from "xlsx";

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
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const parties: ParsedTallyParty[] = [];
  let currentParty: ParsedTallyParty | null = null;
  let currentTransaction: ParsedTallyTransaction | null = null;

  const getCellValue = (r: number, c: number) => {
    const row = rows[r - 1];
    return row ? row[c - 1] : null;
  };

  const getCellText = (r: number, c: number) => {
    const val = getCellValue(r, c);
    if (val === null || val === undefined) return "";
    return String(val).trim();
  };

  const parseDate = (d: any) => {
    if (!d) return "";
    if (d instanceof Date) {
      if (!isNaN(d.getTime())) return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    }
    const dt = new Date(d);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
    return String(d);
  };

  for (let r = 1; r <= rows.length; r++) {
    const col1 = getCellText(r, 1);
    const col2 = getCellText(r, 2);
    const col3 = getCellText(r, 3);
    const col4 = getCellText(r, 4);

    if (col2 === "Date" || col2 === "Group :" || col1 === "Group :") continue;

    if (!col2 && col3 && col3 === col4 && col3 !== "Amount" && col3 !== "Sales" && col3 !== "Receipt" && col3 !== "Purchase" && col3 !== "Payment") {
      currentParty = {
        partyName: col3,
        transactions: []
      };
      parties.push(currentParty);
      currentTransaction = null;
      continue;
    }

    if (!currentParty) continue;

    // If there is a Date in col2 and a Voucher Type in col3, treat as transaction
    // This allows custom voucher types like "GST Sales", "Tax Invoice", "B2B Sale" etc.
    const isProbablyTransaction = col2 && col3 && col3 !== col4 && col3 !== "Amount" && col3 !== "Party's Name";
    if (isProbablyTransaction && currentParty) {
      const vchType = String(col3).toLowerCase();
      let mappedType: ParsedTallyTransaction["type"];
      
      if (vchType.includes("receipt") || vchType.includes("rect")) {
        mappedType = type === "debtors" ? "payment_received" : "payment_made";
      } else if (vchType.includes("payment") || vchType.includes("pmt")) {
        mappedType = type === "creditors" ? "payment_made" : "payment_received";
      } else {
        // Any other voucher type (Sales, GST Sales, Tax Invoice, Journal, Purchase, etc)
        mappedType = type === "debtors" ? "invoice" : "bill";
      }

      currentTransaction = {
        type: mappedType,
        date: parseDate(col2),
        reference: col4,
        amount: parseFloat(getCellText(r, 5)) || 0,
        items: []
      };
      currentParty.transactions.push(currentTransaction);
      continue;
    }

    if (currentTransaction && col1 && !col2 && !col3 && col1.toLowerCase().startsWith("being")) {
      currentTransaction.narration = col1;
      continue;
    }

    if (currentTransaction && (currentTransaction.type === "invoice" || currentTransaction.type === "bill")) {
      if (col2 && col3 && col3 === col4 && col2 !== col3) {
        const itemName = col3;
        const hsnMatch = itemName.match(/HSN\s*(\d+)/i);
        const hsn = hsnMatch ? hsnMatch[1] : "";
        
        let qty = 1;
        const qtyMatch = col2.match(/([\d\.]+)/);
        if (qtyMatch) qty = parseFloat(qtyMatch[1]);
        
        const rateOrAmount = parseFloat(getCellText(r, 5)) || 0;

        currentTransaction.items.push({
          name: itemName.replace(/\(HSN.*?\)/i, "").trim(),
          hsn,
          qty,
          rate: rateOrAmount,
          amount: rateOrAmount // In this tally format rate = amount or we just use it as amount
        });
      }
    }
  }

  return parties.filter(p => p.transactions.length > 0);
}
