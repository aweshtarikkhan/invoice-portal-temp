const fs = require('fs');
let c = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

if (!c.includes('@/components/ui/table')) {
  c = c.replace(
    'import { Label } from "@/components/ui/label";',
    'import { Label } from "@/components/ui/label";\nimport { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";'
  );
  fs.writeFileSync('src/pages/PlatformAdminPage.tsx', c);
  console.log('Fixed imports');
} else {
  console.log('Imports exist');
}
