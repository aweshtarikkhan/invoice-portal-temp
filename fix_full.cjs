const fs = require('fs');

function addFullPageExport(file, id, titleRegex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('exportFullPagePDF')) {
    content = content.replace(
      'import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";',
      'import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";\nimport { exportFullPagePDF } from "@/lib/pdfUtils";'
    );
  }
  
  content = content.replace(
    '<div className="space-y-6">',
    `<div className="space-y-6" id="${id}">`
  );
  
  content = content.replace(titleRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Added full page export to ' + file);
}

// Sales
addFullPageExport(
  'src/pages/SalesReportsPage.tsx',
  'sales-report-page',
  /<div>\s*<h1 className="text-2xl font-bold tracking-tight">Sales Reports<\/h1>\s*<p className="text-muted-foreground">Comprehensive overview of your sales performance and revenue metrics\.<\/p>\s*<\/div>/,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground">Comprehensive overview of your sales performance and revenue metrics.</p>
        </div>
        <Button onClick={() => exportFullPagePDF('sales-report-page', 'sales_full_report')} className="shrink-0" variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report (PDF)
        </Button>
      </div>`
);

// Inventory
addFullPageExport(
  'src/pages/InventoryReportsPage.tsx',
  'inventory-report-page',
  /<div>\s*<h1 className="text-2xl font-bold tracking-tight">Inventory Reports<\/h1>\s*<p className="text-muted-foreground">Analyze your stock movements, valuations, and low stock items\.<\/p>\s*<\/div>/,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Reports</h1>
          <p className="text-muted-foreground">Analyze your stock movements, valuations, and low stock items.</p>
        </div>
        <Button onClick={() => exportFullPagePDF('inventory-report-page', 'inventory_full_report')} className="shrink-0" variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report (PDF)
        </Button>
      </div>`
);

// HR
addFullPageExport(
  'src/pages/HRReportsPage.tsx',
  'hr-report-page',
  /<div>\s*<h1 className="text-2xl font-bold text-gray-900">HR Reports<\/h1>\s*<p className="text-gray-500 mt-1">Monitor workforce analytics, attendance, and payroll trends\.<\/p>\s*<\/div>/,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Reports</h1>
          <p className="text-gray-500 mt-1">Monitor workforce analytics, attendance, and payroll trends.</p>
        </div>
        <Button onClick={() => exportFullPagePDF('hr-report-page', 'hr_full_report')} className="shrink-0" variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report (PDF)
        </Button>
      </div>`
);

