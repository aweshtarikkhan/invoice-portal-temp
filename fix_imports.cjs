const fs = require('fs');
let c = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');
c = c.replace('import { Input } from "@/components/ui/input";', 'import { Input } from "@/components/ui/input";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { Label } from "@/components/ui/label";');
fs.writeFileSync('src/pages/InvoicesPage.tsx', c);
console.log('Fixed imports');
