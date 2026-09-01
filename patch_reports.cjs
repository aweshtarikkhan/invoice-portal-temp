const fs = require('fs');

// 1. Fix AppSidebar.tsx
let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Remove reportItems array definition
sidebar = sidebar.replace(/const reportItems = \[\s*\{ title: "General Reports"[\s\S]*?\];/g, '');

// Remove `{ key: "reports", label: "Reports", items: reportItems },`
sidebar = sidebar.replace(/\{\s*key:\s*"reports",\s*label:\s*"Reports",\s*items:\s*reportItems\s*\},?\s*/g, '');

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar, 'utf8');
console.log('AppSidebar patched!');

// 2. Fix feature-store.ts
let featureStore = fs.readFileSync('src/store/feature-store.ts', 'utf8');

// The reports group currently has Statements, Reports, Business Report, Accounting Reports, P&L, GST Returns, TDS, Inventory Valuation, Aging Details.
// The user wants ALL reports here: General Reports, Sales Reports, Purchases Reports, Accounting Reports, Business Report, Inventory Reports, HR Reports, CRM Reports.
// I'll update the reports group to have exactly the comprehensive list of reports.

const newReportsItems = `      items: [
        { key: "reports", title: "General Reports", description: "All business reports", icon: "BarChart3", url: "/reports" },
        { key: "sales-reports", title: "Sales Reports", description: "Analyze your sales", icon: "BarChart3", url: "/sales-reports" },
        { key: "purchases-reports", title: "Purchases Reports", description: "Analyze your purchases", icon: "BarChart3", url: "/purchase-accounting-reports" },
        { key: "accounting-reports", title: "Accounting Reports", description: "Financial reports", icon: "Landmark", url: "/accounting-reports" },
        { key: "business-report", title: "Business Report", description: "Detailed analytics and KPIs", icon: "BarChart3", url: "/business-report" },
        { key: "inventory-reports", title: "Inventory Reports", description: "Analyze your inventory", icon: "BarChart3", url: "/inventory-reports" },
        { key: "hr-reports", title: "HR Reports", description: "Employee analytics", icon: "BarChart3", url: "/hr-reports" },
        { key: "crm-reports", title: "CRM Reports", description: "Analyze your leads and pipeline", icon: "BarChart3", url: "/crm-marketing-reports" },
        { key: "marketing-reports", title: "Marketing Reports", description: "Analyze your marketing campaigns", icon: "BarChart3", url: "/crm-marketing-reports" },
        { key: "profit-loss", title: "Profit & Loss", description: "P&L statements", icon: "PieChart", url: "/profit-loss" },
        { key: "gst-returns", title: "GST Returns", description: "GST filing reports", icon: "FileBarChart2", url: "/gst-returns" },
        { key: "tds", title: "TDS/TCS Returns", description: "Tax deducted at source", icon: "Percent", url: "/tds" },
        { key: "inventory-valuation", title: "Inventory Valuation", description: "Stock valuation reports", icon: "Boxes", url: "/inventory-valuation" },
        { key: "aging-details", title: "Aging Details", description: "Receivables & payables aging", icon: "ScrollText", url: "/aging-details" },
        { key: "statements", title: "Statements", description: "Customer statements", icon: "FileSpreadsheet", url: "/statements" },
      ],`;

featureStore = featureStore.replace(/items: \[\s*\{ key: "statements",[\s\S]*?\{ key: "aging-details".*\}\s*,?\s*\],/g, newReportsItems);

// Now remove the reports from their original groups so they don't appear twice.
// from sales:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"sales-reports"[\s\S]*?\},/g, '');
// from catalog:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"inventory-reports"[\s\S]*?\},/g, '');
// from purchases:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"purchases-reports"[\s\S]*?\},/g, '');
// from accounting:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"accounting-reports"[\s\S]*?\},/g, '');
// from people:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"hr-reports"[\s\S]*?\},/g, '');
// from crm:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"crm-reports"[\s\S]*?\},/g, '');
// from marketing:
featureStore = featureStore.replace(/\s*\{\s*key:\s*"marketing-reports"[\s\S]*?\},/g, '');

fs.writeFileSync('src/store/feature-store.ts', featureStore, 'utf8');
console.log('feature-store patched!');
