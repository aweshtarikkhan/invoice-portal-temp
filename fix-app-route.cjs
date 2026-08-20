const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  '<Route path="/crm-dashboard" element={<CRMDashboardPage />} />',
  '<Route path="/crm-dashboard" element={<CRMDashboardPage />} />\n                  <Route path="/calendar" element={<CRMCalendarPage />} />'
);

fs.writeFileSync('src/App.tsx', appCode);
console.log("Fixed calendar route in App.tsx");
