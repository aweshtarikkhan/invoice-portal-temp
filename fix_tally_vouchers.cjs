const fs = require('fs');

let c = fs.readFileSync('src/lib/tally-sync-parser.ts', 'utf8');

const oldLogic = `    if (col3 === "Sales" || col3 === "Receipt" || col3 === "Purchase" || col3 === "Payment") {
      const vchType = col3;
      let mappedType: ParsedTallyTransaction["type"];
      
      if (vchType === "Sales" && type === "debtors") mappedType = "invoice";
      else if (vchType === "Receipt" && type === "debtors") mappedType = "payment_received";
      else if (vchType === "Purchase" && type === "creditors") mappedType = "bill";
      else if (vchType === "Payment" && type === "creditors") mappedType = "payment_made";
      else mappedType = type === "debtors" ? "invoice" : "bill";`;

const newLogic = `    // If there is a Date in col2 and a Voucher Type in col3, treat as transaction
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
      }`;

if (c.includes(oldLogic)) {
  c = c.replace(oldLogic, newLogic);
  fs.writeFileSync('src/lib/tally-sync-parser.ts', c);
  console.log('Fixed Tally Sync Parser transaction detection');
} else {
  console.log('Could not find old logic in tally-sync-parser.ts');
}
