const fs = require('fs');
const file = 'src/pages/InventoryReportsPage.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'import { Package, AlertTriangle, ArrowRightLeft, DollarSign, Download } from "lucide-react";',
  'import { Package, AlertTriangle, ArrowRightLeft, DollarSign, Download, FileText } from "lucide-react";'
);
fs.writeFileSync(file, c);
console.log('Fixed FileText import');
