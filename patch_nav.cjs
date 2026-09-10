const fs = require('fs');

// App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');
if (!app.includes('TallySyncPage')) {
  app = app.replace('import InvoicesPage from "@/pages/InvoicesPage";', 'import InvoicesPage from "@/pages/InvoicesPage";\nimport TallySyncPage from "@/pages/TallySyncPage";');
  app = app.replace('<Route path="/invoices" element={<InvoicesPage />} />', '<Route path="/invoices" element={<InvoicesPage />} />\n              <Route path="/tally-sync" element={<TallySyncPage />} />');
  fs.writeFileSync('src/App.tsx', app);
  console.log('Patched App.tsx');
}

// DashboardPage.tsx
let dash = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');
if (!dash.includes('/tally-sync')) {
  dash = dash.replace(
    '<DropdownMenuItem className="cursor-pointer" onClick={() => navigate(\'/bills/new\')}>',
    `<DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/tally-sync')}>
                        <Upload className="w-4 h-4 mr-2 text-blue-500" />
                        Tally Master Sync
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/bills/new')}>`
  );
  if (!dash.includes('Upload')) {
     dash = dash.replace('FileSpreadsheet,', 'FileSpreadsheet, Upload,');
  }
  fs.writeFileSync('src/pages/DashboardPage.tsx', dash);
  console.log('Patched DashboardPage.tsx');
}
