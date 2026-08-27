const fs = require('fs');
let content = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// 1. Create reportsItems array
const reportItemsMatch = `
  const reportItems = [
    { title: "General Reports", url: "/reports", icon: BarChart3, addUrl: null },
    { title: "Sales Reports", url: "/sales-reports", icon: BarChart3, addUrl: null },
    { title: "Purchases Reports", url: "/purchase-accounting-reports", icon: BarChart3, addUrl: null },
    { title: "Accounting Reports", url: "/accounting-reports", icon: Landmark, addUrl: null },
    { title: "Business Report", url: "/business-report", icon: BarChart3, addUrl: null },
    { title: "Inventory Reports", url: "/inventory-reports", icon: BarChart3, addUrl: null },
    { title: "HR Reports", url: "/hr-reports", icon: BarChart3, addUrl: null },
    { title: "CRM Reports", url: "/crm-marketing-reports", icon: BarChart3, addUrl: null },
  ];
`;

content = content.replace('const salesItems = [', reportItemsMatch + '\n  const salesItems = [');

// 2. Remove the report items from their original arrays
const itemsToRemove = [
  '{ title: "General Reports", url: "/reports", icon: BarChart3, addUrl: null },',
  '{ title: "Sales Reports", url: "/sales-reports", icon: BarChart3, addUrl: null },',
  '{ title: "Purchases Reports", url: "/purchase-accounting-reports", icon: BarChart3, addUrl: null },',
  '{ title: "Accounting Reports", url: "/accounting-reports", icon: Landmark, addUrl: null },',
  '{ title: "Business Report", url: "/business-report", icon: BarChart3, addUrl: null },',
  '{ title: "Inventory Reports", url: "/inventory-reports", icon: BarChart3, addUrl: null },',
  '{ title: "HR Reports", url: "/hr-reports", icon: BarChart3, addUrl: null },',
  '{ title: "CRM Reports", url: "/crm-marketing-reports", icon: BarChart3, addUrl: null },'
];

itemsToRemove.forEach(item => {
  content = content.replace(new RegExp(`\\s*${item.replace(/[.*+?^$\{key\}()|[\\]\\\\]/g, '\\$&')}`, 'g'), '');
});

// 3. Add to defaultGroups
// { key: "sales", label: "Sales", items: salesItems... }
// add { key: "reports", label: "Reports", items: reportItems }
content = content.replace(
  /\{ key: "sales", label: "Sales", items:/,
  `{ key: "reports", label: "Reports", items: reportItems },
    { key: "sales", label: "Sales", items:`
);

// 4. Add "reports" to bmKeys
content = content.replace(
  /const bmKeys = \["sales", "catalog", "purchases", "accounting"\];/,
  `const bmKeys = ["sales", "catalog", "purchases", "accounting", "reports"];`
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', content, 'utf8');
console.log('AppSidebar patched!');
