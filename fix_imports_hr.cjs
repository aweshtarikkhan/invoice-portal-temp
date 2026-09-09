const fs = require('fs');

const fixImports = (file, extraLucide) => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { Button }')) {
    content = content.replace('import { useAppStore } from "@/store/app-store";', 'import { useAppStore } from "@/store/app-store";\nimport { Button } from "@/components/ui/button";');
  }
  if (!content.includes('Download') && content.includes('lucide-react')) {
    content = content.replace(' } from "lucide-react"', extraLucide);
  }
  fs.writeFileSync(file, content);
};

fixImports('src/pages/HRReportsPage.tsx', ', Download } from "lucide-react"');
