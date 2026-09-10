const fs = require('fs');

let c = fs.readFileSync('src/pages/PurchaseOrdersPage.tsx', 'utf8');

const normalizeStatusFunc = `
function normalizePOStatus(st: any): string {
  if (!st) return "draft";
  const s = String(st).toLowerCase().trim();
  if (s === "unpaid" || s === "pending") return "sent";
  if (["draft", "sent", "received", "cancelled"].includes(s)) {
    return s;
  }
  return "draft";
}
`;

if (!c.includes('normalizePOStatus')) {
  c = c.replace('export default function PurchaseOrdersPage() {', normalizeStatusFunc + '\nexport default function PurchaseOrdersPage() {');
}

c = c.replace(
  'status: row.status || "draft",',
  'status: normalizePOStatus(row.status),'
);

fs.writeFileSync('src/pages/PurchaseOrdersPage.tsx', c);
console.log('Fixed PurchaseOrdersPage status mapping');
