const fs = require('fs');

// Add route to App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('CRMAutomationsPage')) {
  appCode = appCode.replace(
    'const CRMDashboardPage = lazy(() => import("./pages/CRMDashboardPage"));',
    'const CRMDashboardPage = lazy(() => import("./pages/CRMDashboardPage"));\nconst CRMAutomationsPage = lazy(() => import("./pages/CRMAutomationsPage"));'
  );
  
  appCode = appCode.replace(
    '<Route path="/crm-dashboard" element={<CRMDashboardPage />} />',
    '<Route path="/crm-dashboard" element={<CRMDashboardPage />} />\n                  <Route path="/crm/automations" element={<CRMAutomationsPage />} />'
  );
  fs.writeFileSync('src/App.tsx', appCode);
}

// Add to feature store for navigation
let storeCode = fs.readFileSync('src/store/feature-store.ts', 'utf8');
if (!storeCode.includes('crm/automations')) {
  // Find the CRM group and add Automations
  storeCode = storeCode.replace(
    '{ key: "calendar", title: "Calendar", description: "Schedule and tasks", icon: "Calendar", url: "/calendar" },',
    '{ key: "calendar", title: "Calendar", description: "Schedule and tasks", icon: "Calendar", url: "/calendar" },\n      { key: "automations", title: "Automations", description: "Workflow rules", icon: "Zap", url: "/crm/automations" },'
  );
  fs.writeFileSync('src/store/feature-store.ts', storeCode);
}
console.log("Automations Routing patched");
