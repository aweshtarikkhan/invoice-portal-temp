const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('import("@/pages/TallySyncPage")')) {
  app = app.replace(
    'const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));', 
    'const TallySyncPage = lazy(() => import("@/pages/TallySyncPage"));\nconst InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));'
  );
  fs.writeFileSync('src/App.tsx', app);
  console.log('Fixed App.tsx imports');
}
