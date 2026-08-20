const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('CrmIntegrationsPage')) {
  // Add import
  code = code.replace(
    'const SettingsPage = lazy(() => import("./pages/SettingsPage"));',
    'const SettingsPage = lazy(() => import("./pages/SettingsPage"));\nconst CrmIntegrationsPage = lazy(() => import("./pages/CrmIntegrationsPage"));'
  );
  
  // Add route under CRM FeatureGuard
  code = code.replace(
    '<Route path="/marketing" element={<MarketingPostersPage />} />',
    '<Route path="/marketing" element={<MarketingPostersPage />} />\n                <Route path="/crm/integrations" element={<CrmIntegrationsPage />} />'
  );
  
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx");
}
