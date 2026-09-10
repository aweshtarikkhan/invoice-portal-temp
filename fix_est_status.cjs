const fs = require('fs');

let c = fs.readFileSync('src/pages/EstimatesPage.tsx', 'utf8');

const normalizeStatusFunc = `
function normalizeEstStatus(st: any): "draft" | "sent" | "accepted" | "rejected" | "expired" {
  if (!st) return "draft";
  const s = String(st).toLowerCase().trim();
  if (s === "pending") return "sent";
  if (s === "approved") return "accepted";
  if (["draft", "sent", "accepted", "rejected", "expired"].includes(s)) {
    return s as any;
  }
  return "draft";
}
`;

if (!c.includes('normalizeEstStatus')) {
  c = c.replace('export default function EstimatesPage() {', normalizeStatusFunc + '\nexport default function EstimatesPage() {');
}

if (!c.includes('status: normalizeEstStatus')) {
  c = c.replace(
    'status: row.status || "draft",',
    'status: normalizeEstStatus(row.status),'
  );
  fs.writeFileSync('src/pages/EstimatesPage.tsx', c);
}
console.log('Fixed EstimatesPage status mapping');
