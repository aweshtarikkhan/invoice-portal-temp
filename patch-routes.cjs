const fs = require('fs');

// Add route to App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('SupportTicketsPage')) {
  appCode = appCode.replace(
    'const SettingsPage = lazy(() => import("./pages/SettingsPage"));',
    'const SettingsPage = lazy(() => import("./pages/SettingsPage"));\nconst SupportTicketsPage = lazy(() => import("./pages/SupportTicketsPage"));'
  );
  
  appCode = appCode.replace(
    '<Route path="/settings" element={<SettingsPage />} />',
    '<Route path="/settings" element={<SettingsPage />} />\n                <Route path="/tickets" element={<SupportTicketsPage />} />'
  );
  fs.writeFileSync('src/App.tsx', appCode);
}

// Add to feature store for navigation
let storeCode = fs.readFileSync('src/store/feature-store.ts', 'utf8');
if (!storeCode.includes('Support Tickets')) {
  // Find the CRM group and add Support Tickets
  storeCode = storeCode.replace(
    /\{ key: "pipeline", title: "Sales Pipeline", description: "Visual deal tracking", icon: "Kanban", url: "\/pipeline" \},/,
    '{ key: "pipeline", title: "Sales Pipeline", description: "Visual deal tracking", icon: "Kanban", url: "/pipeline" },\n      { key: "tickets", title: "Support Tickets", description: "Manage customer helpdesk", icon: "Ticket", url: "/tickets" },'
  );
  fs.writeFileSync('src/store/feature-store.ts', storeCode);
}
console.log("Routing patched");
