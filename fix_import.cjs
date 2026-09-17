const fs = require('fs');
const file = 'src/App.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('import PartnerWithUsPage')) {
  c = c.replace(
    'import SupportPage from "@/pages/SupportPage";',
    'import SupportPage from "@/pages/SupportPage";\nimport PartnerWithUsPage from "@/pages/PartnerWithUsPage";'
  );
  fs.writeFileSync(file, c);
  console.log('Fixed missing import');
} else {
  console.log('Import already exists');
}
