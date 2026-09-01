const fs = require('fs');

let content = fs.readFileSync('src/store/feature-store.ts', 'utf8');

// 1. Remove them from the reports group
content = content.replace(/\s*\{\s*key:\s*"hr-reports"[\s\S]*?\},/g, '');
content = content.replace(/\s*\{\s*key:\s*"crm-reports"[\s\S]*?\},/g, '');
content = content.replace(/\s*\{\s*key:\s*"marketing-reports"[\s\S]*?\},/g, '');

// 2. Add hr-reports to people group
content = content.replace(
  /(key:\s*"people"[\s\S]*?items:\s*\[)/,
  `$1\n      { key: "hr-reports", title: "HR Reports", description: "Employee analytics", icon: "BarChart3", url: "/hr-reports" },`
);

// 3. Add crm-reports to crm group
content = content.replace(
  /(key:\s*"crm"[\s\S]*?items:\s*\[)/,
  `$1\n      { key: "crm-reports", title: "CRM Reports", description: "Analyze your leads and pipeline", icon: "BarChart3", url: "/crm-marketing-reports" },`
);

// 4. Add marketing-reports to marketing group
content = content.replace(
  /(key:\s*"marketing"[\s\S]*?items:\s*\[)/,
  `$1\n      { key: "marketing-reports", title: "Marketing Reports", description: "Analyze your marketing campaigns", icon: "BarChart3", url: "/crm-marketing-reports" },`
);

fs.writeFileSync('src/store/feature-store.ts', content, 'utf8');
console.log('Feature store updated');
