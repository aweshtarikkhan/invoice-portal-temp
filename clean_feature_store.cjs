const fs = require('fs');

let featureStore = fs.readFileSync('src/store/feature-store.ts', 'utf8');

const toRemove = [
  '{ key: "accounting-reports", title: "Accounting Reports", description: "Financial reports", icon: "Landmark", url: "/accounting-reports" },',
  '{ key: "hr-reports", title: "HR Reports", description: "Employee analytics", icon: "BarChart3", url: "/hr-reports" },',
  '{ key: "crm-reports", title: "CRM Reports", description: "Analyze your leads and pipeline", icon: "BarChart3", url: "/crm-marketing-reports" },',
  '{ key: "marketing-reports", title: "Marketing Reports", description: "Analyze your marketing campaigns", icon: "BarChart3", url: "/crm-marketing-reports" },',
  '{ key: "business-report", title: "Business Report", description: "Detailed analytics and KPIs", icon: "BarChart3", url: "/business-report" },'
];

toRemove.forEach(item => {
  // We only want to remove them from OUTSIDE the reports group.
  // Wait, if I do a global replace, they get removed from the reports group too!
  // So I shouldn't do a global replace of the whole string.
  // Instead, I'll split the file at the `key: "reports",` line.
  
  const parts = featureStore.split(/key: "reports",\s*label: "Reports",/);
  if (parts.length === 2) {
    let topPart = parts[0];
    const bottomPart = parts[1]; // contains the reports group and below
    
    topPart = topPart.replace(new RegExp('\\s*' + item.replace(/[.*+?^$\{key\}()|[\\]\\\\]/g, '\\$&'), 'g'), '');
    
    featureStore = topPart + 'key: "reports",\n      label: "Reports",' + bottomPart;
  }
});

fs.writeFileSync('src/store/feature-store.ts', featureStore, 'utf8');
console.log('Removed duplicate reports from other groups');
