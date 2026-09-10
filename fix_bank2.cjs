const fs = require('fs');
let c = fs.readFileSync('src/pages/BankAccountDetailPage.tsx', 'utf8');
c = c.replace('const parseDate = (s: string): string => {', 'const parseDate = (val: any): string => {\\n    const s = String(val||"").trim();');
fs.writeFileSync('src/pages/BankAccountDetailPage.tsx', c);
