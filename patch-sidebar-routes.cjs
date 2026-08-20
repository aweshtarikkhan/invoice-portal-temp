const fs = require('fs');

let storeCode = fs.readFileSync('src/store/feature-store.ts', 'utf8');

const targetPipelineLine = '{ key: "pipeline", title: "Pipeline", description: "Sales pipeline view", icon: "BarChart3", url: "/pipeline" },';
const replacementPipelineLine = `{ key: "pipeline", title: "Pipeline", description: "Sales pipeline view", icon: "BarChart3", url: "/pipeline" },
      { key: "calendar", title: "Calendar", description: "Schedule and tasks", icon: "Calendar", url: "/calendar" },
      { key: "tickets", title: "Support Tickets", description: "Manage customer helpdesk", icon: "Ticket", url: "/tickets" },`;

if (storeCode.includes(targetPipelineLine) && !storeCode.includes('Support Tickets')) {
  storeCode = storeCode.replace(targetPipelineLine, replacementPipelineLine);
  fs.writeFileSync('src/store/feature-store.ts', storeCode);
  console.log("Successfully added routes to feature-store.ts");
} else {
  console.log("Could not find pipeline line or routes already added.");
}
