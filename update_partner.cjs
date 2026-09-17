const fs = require('fs');

const file = 'src/pages/PartnerWithUsPage.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('PublicHeader')) {
  c = c.replace('import { ArrowRight, Handshake, Mail, Phone, User, Building } from "lucide-react";', 
    'import { ArrowRight, Handshake, Mail, Phone, User, Building } from "lucide-react";\nimport { PublicHeader } from "@/components/public/PublicHeader";\nimport { PublicFooter } from "@/components/public/PublicFooter";');
}

// Ensure the page wraps with PublicHeader and PublicFooter.
// Currently it returns <div className="min-h-screen bg-slate-50 ...">
// We'll wrap it in a Fragment or a flex column.
const returnIndex = c.indexOf('return (');
if (returnIndex !== -1 && !c.includes('<PublicHeader />')) {
  const returnContent = c.slice(returnIndex);
  const newReturn = returnContent.replace('return (', 'return (\n    <div className="min-h-screen flex flex-col bg-slate-50">\n      <PublicHeader />\n      <main className="flex-grow">')
                                 .replace(/;\s*$/, '\n      </main>\n      <PublicFooter />\n    </div>\n  );');
  c = c.slice(0, returnIndex) + newReturn;
}

fs.writeFileSync(file, c);
console.log('Updated PartnerWithUsPage.tsx');
