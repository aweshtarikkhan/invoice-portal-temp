const fs = require('fs');

let content = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Fix reportItems array
const replaceSearch = /const reportItems = \[\s*\];/;
const replaceWith = `const reportItems = [
    { title: "General Reports", url: "/reports", icon: BarChart3, addUrl: null },
    { title: "Sales Reports", url: "/sales-reports", icon: BarChart3, addUrl: null },
    { title: "Purchases Reports", url: "/purchase-accounting-reports", icon: BarChart3, addUrl: null },
    { title: "Accounting Reports", url: "/accounting-reports", icon: Landmark, addUrl: null },
    { title: "Business Report", url: "/business-report", icon: BarChart3, addUrl: null },
    { title: "Inventory Reports", url: "/inventory-reports", icon: BarChart3, addUrl: null },
    { title: "HR Reports", url: "/hr-reports", icon: BarChart3, addUrl: null },
    { title: "CRM Reports", url: "/crm-marketing-reports", icon: BarChart3, addUrl: null },
  ];`;

content = content.replace(replaceSearch, replaceWith);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', content, 'utf8');
console.log('Fixed reportItems');
