const fs = require('fs');

let c = fs.readFileSync('src/pages/BillsPage.tsx', 'utf8');

const normalizeStatusFunc = `
function normalizeBillStatus(st: any): "draft" | "received" | "partial" | "paid" | "cancelled" {
  if (!st) return "draft";
  const s = String(st).toLowerCase().trim();
  if (s === "unpaid" || s === "pending") return "received";
  if (["draft", "received", "partial", "paid", "cancelled"].includes(s)) {
    return s as any;
  }
  return "draft";
}
`;

if (!c.includes('normalizeBillStatus')) {
  c = c.replace('export default function BillsPage() {', normalizeStatusFunc + '\nexport default function BillsPage() {');
}

c = c.replace(
  'status: row.status || "draft",',
  'status: normalizeBillStatus(row.status),'
);

fs.writeFileSync('src/pages/BillsPage.tsx', c);
console.log('Fixed BillsPage status mapping');
