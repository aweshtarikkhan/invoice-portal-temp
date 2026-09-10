const fs = require('fs');

const filesToFix = [
  'src/pages/BankAccountDetailPage.tsx',
  'src/pages/InvoicesPage.tsx',
  'src/pages/PaymentsPage.tsx'
];

filesToFix.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (f.includes('BankAccountDetailPage.tsx')) {
    const regex = /const parseDate = \(s: string\): string => \{\s*if \(\!s\) return "";\s*const m1 = s\.match/g;
    if (regex.test(content)) {
      content = content.replace(regex, `const parseDate = (val: any): string => {
    if (!val) return "";
    const s = String(val).trim();
    const m1 = s.match`);
      changed = true;
    }
  }

  if (f.includes('InvoicesPage.tsx')) {
    const regex = /const parseDate = \(d: string\) => \{\s*if \(\!d\) return null;\s*\/\/ Handle DD-MM-YYYY or DD\/MM\/YYYY\s*const m = d\.match/g;
    if (regex.test(content)) {
      content = content.replace(regex, `const parseDate = (val: any) => {
            if (!val) return null;
            const d = String(val).trim();
            // Handle DD-MM-YYYY or DD/MM/YYYY
            const m = d.match`);
      changed = true;
    }
  }

  if (f.includes('PaymentsPage.tsx')) {
    const regex = /const parseDate = \(d: string\) => \{\s*if \(\!d\) return null;\s*const m = d\.match/g;
    if (regex.test(content)) {
      content = content.replace(regex, `const parseDate = (val: any) => {
      if (!val) return null;
      const d = String(val).trim();
      const m = d.match`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(f, content);
    console.log('Fixed:', f);
  } else {
    console.log('Not changed:', f);
  }
});
