const fs = require('fs');
let c = fs.readFileSync('src/pages/BankAccountDetailPage.tsx', 'utf8');
const target = `const parseDate = (s: string): string => {
    if (!s) return new Date().toISOString().slice(0, 10);
    // Try dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd
    const m1 = s.match`;
const replacement = `const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString().slice(0, 10);
    const s = String(val).trim();
    // Try dd/mm/yyyy or dd-mm-yyyy or yyyy-mm-dd
    const m1 = s.match`;
c = c.replace(target, replacement);
fs.writeFileSync('src/pages/BankAccountDetailPage.tsx', c);
