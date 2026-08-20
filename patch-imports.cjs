const fs = require('fs');
let code = fs.readFileSync('src/pages/BankAccountDetailPage.tsx', 'utf8');

if (!code.includes('Search,')) {
  code = code.replace(
    'import { ArrowLeft, Upload, Plus, Link2, Trash2, CheckCircle2 } from "lucide-react";',
    'import { ArrowLeft, Upload, Plus, Link2, Trash2, CheckCircle2, Search } from "lucide-react";'
  );
  fs.writeFileSync('src/pages/BankAccountDetailPage.tsx', code);
}
console.log("Patched imports");
