const fs = require('fs');

let content = fs.readFileSync('src/store/feature-store.ts', 'utf8');

const replacement = `      items: [
        { key: "reports", title: "General Reports", description: "All business reports", icon: "BarChart3", url: "/reports" },
        { key: "sales-reports", title: "Sales Reports", description: "Analyze your sales", icon: "BarChart3", url: "/sales-reports" },
        { key: "purchases-reports", title: "Purchases Reports", description: "Analyze your purchases", icon: "BarChart3", url: "/purchase-accounting-reports" },
        { key: "inventory-reports", title: "Inventory Reports", description: "Analyze your inventory", icon: "BarChart3", url: "/inventory-reports" },
        { key: "accounting-reports", title: "Accounting Reports", description: "Financial reports", icon: "Landmark", url: "/accounting-reports" },`;

content = content.replace(
  /items:\s*\[\s*\{\s*key:\s*"reports",\s*title:\s*"General Reports"[^\}]+\},[\s\S]*?\{\s*key:\s*"accounting-reports"[^\}]+\},/,
  replacement
);

fs.writeFileSync('src/store/feature-store.ts', content, 'utf8');
console.log('Reports added to reports group');
