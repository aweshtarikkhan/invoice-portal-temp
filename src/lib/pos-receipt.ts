import { jsPDF } from "jspdf";
import { format } from "date-fns";

export interface POSReceiptData {
  orgName: string;
  orgAddress?: string;
  orgPhone?: string;
  orgGstin?: string;
  invoiceNumber: string;
  issueDate?: string;
  cashierName?: string;
  customerName?: string;
  lines: Array<{
    name: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subTotal: number;
  taxBreakdown: Array<{ name: string; amount: number }>;
  total: number;
  amountPaid: number;
  paymentMode?: string;
  currencySymbol?: string;
}

export function generatePOSReceiptBlob(data: POSReceiptData): Blob {
  // Setup 80mm thermal receipt with dynamic height
  const maxChars = 32; 

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 297] // Standard roll receipt height, will cut off naturally
  });

  let y = 10;
  const lineH = 4;
  const marginLeft = 5;

  doc.setFont("courier", "normal");
  doc.setFontSize(9); // Size 9 fits ~32 chars nicely

  const drawDivider = (char = "-") => {
    doc.text(char.repeat(maxChars), marginLeft, y);
    y += lineH;
  };

  const drawCenterText = (text: string) => {
    const trimmed = text.substring(0, maxChars);
    const spaces = Math.max(0, Math.floor((maxChars - trimmed.length) / 2));
    doc.text(" ".repeat(spaces) + trimmed, marginLeft, y);
    y += lineH;
  };

  const drawLeftRight = (left: string, right: string) => {
    let l = left.substring(0, maxChars - right.length - 1);
    const spaces = maxChars - l.length - right.length;
    doc.text(l + " ".repeat(Math.max(0, spaces)) + right, marginLeft, y);
    y += lineH;
  };

  const sym = data.currencySymbol || "Rs ";
  const fmt = (n: number) => n.toFixed(2);

  // HEADER
  drawDivider("=");
  drawCenterText(data.orgName || "STORE");
  if (data.orgAddress) drawCenterText(data.orgAddress);
  if (data.orgPhone) drawCenterText(`Ph: ${data.orgPhone}`);
  drawDivider("=");
  
  if (data.orgGstin) {
    doc.text(`GSTIN: ${data.orgGstin}`, marginLeft, y);
    y += lineH;
  }
  y += lineH - 2;

  // DETAILS
  doc.text(`Bill No : ${data.invoiceNumber}`, marginLeft, y); y += lineH;
  
  const dateStr = data.issueDate 
    ? format(new Date(data.issueDate), "dd/MM/yyyy") 
    : format(new Date(), "dd/MM/yyyy");
  doc.text(`Date    : ${dateStr}`, marginLeft, y); y += lineH;
  
  doc.text(`Cashier : ${data.cashierName || "Admin"}`, marginLeft, y); y += lineH;
  doc.text(`Customer: ${data.customerName || "Walk-in"}`, marginLeft, y); y += lineH;

  // ITEMS HEADER
  drawDivider("-");
  doc.text("ITEM         QTY   RATE  TOTAL", marginLeft, y); y += lineH;
  drawDivider("-");

  // ITEMS
  for (const item of data.lines) {
    const nameStr = item.name.substring(0, 12).padEnd(12, " ");
    const qtyStr = item.quantity.toString().padStart(3, " ");
    const rateStr = fmt(item.rate).padStart(6, " ");
    const totalStr = fmt(item.amount).padStart(7, " ");
    
    doc.text(`${nameStr} ${qtyStr} ${rateStr} ${totalStr}`, marginLeft, y);
    y += lineH;
    
    // If name is longer than 12, wrap it below
    if (item.name.length > 12) {
        const remaining = item.name.substring(12, 44);
        doc.text(remaining, marginLeft, y);
        y += lineH;
    }
  }

  // TOTALS
  drawDivider("-");
  drawLeftRight("Sub-Total", fmt(data.subTotal));
  
  for (const tax of data.taxBreakdown) {
    drawLeftRight(tax.name, fmt(tax.amount));
  }
  drawDivider("-");
  
  doc.setFont("courier", "bold");
  drawLeftRight("TOTAL AMOUNT:", `${sym}${fmt(data.total)}`);
  doc.setFont("courier", "normal");
  drawDivider("-");

  drawLeftRight(`Paid By : ${data.paymentMode || "Cash"}`, `${sym}${fmt(data.amountPaid)}`);
  
  const change = data.amountPaid - data.total;
  if (change > 0) {
    drawLeftRight("Change  :", `${sym}${fmt(change)}`);
  }
  
  drawDivider("=");
  drawCenterText("THANK YOU! VISIT AGAIN");
  drawCenterText("Goods once sold will not");
  drawCenterText("be taken back or exchanged.");
  drawDivider("=");

  return doc.output("blob");
}
