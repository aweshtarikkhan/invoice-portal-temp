const fs = require('fs');
const file = 'src/App.tsx';
let c = fs.readFileSync(file, 'utf8');

if (!c.includes('const PartnerWithUsPage = lazy')) {
  c = c.replace(
    'const SupportPage = lazy(() => import("./pages/SupportPage"));',
    'const SupportPage = lazy(() => import("./pages/SupportPage"));\nconst PartnerWithUsPage = lazy(() => import("./pages/PartnerWithUsPage"));'
  );
  fs.writeFileSync(file, c);
  console.log('Fixed missing lazy import');
} else {
  console.log('Import already exists');
}
