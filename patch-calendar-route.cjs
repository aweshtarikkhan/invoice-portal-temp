const fs = require('fs');

// Add route to App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('CRMCalendarPage')) {
  appCode = appCode.replace(
    'const CRMDashboardPage = lazy(() => import("./pages/CRMDashboardPage"));',
    'const CRMDashboardPage = lazy(() => import("./pages/CRMDashboardPage"));\nconst CRMCalendarPage = lazy(() => import("./pages/CRMCalendarPage"));'
  );
  
  appCode = appCode.replace(
    '<Route path="/crm" element={<CRMDashboardPage />} />',
    '<Route path="/crm" element={<CRMDashboardPage />} />\n                <Route path="/calendar" element={<CRMCalendarPage />} />'
  );
  fs.writeFileSync('src/App.tsx', appCode);
}

// Add to feature store for navigation
let storeCode = fs.readFileSync('src/store/feature-store.ts', 'utf8');
if (!storeCode.includes('Calendar')) {
  // Find the CRM group and add Calendar
  storeCode = storeCode.replace(
    /\{ key: "pipeline", title: "Sales Pipeline", description: "Visual deal tracking", icon: "Kanban", url: "\/pipeline" \},/,
    '{ key: "pipeline", title: "Sales Pipeline", description: "Visual deal tracking", icon: "Kanban", url: "/pipeline" },\n      { key: "calendar", title: "Calendar", description: "Schedule and tasks", icon: "Calendar", url: "/calendar" },'
  );
  fs.writeFileSync('src/store/feature-store.ts', storeCode);
}
console.log("Calendar Routing patched");
