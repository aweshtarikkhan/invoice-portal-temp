const fs = require('fs');

const path = 'src/pages/InventoryReportsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('exportTableToCSV')) {
  content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";');
}
if (!content.includes('FileText')) {
  content = content.replace('Download } from "lucide-react"', 'Download, FileText } from "lucide-react"');
}

const oldButtonRegex = /<Button[\s\S]*?Export CSV[\s\S]*?<\/Button>/;
const newButtons = `<div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!lowStock.length) return;
                const headers = ["Item Name", "Type", "Quantity"];
                const rows = lowStock.map(item => [
                  item.name || '',
                  item.type || '',
                  item.quantity || 0
                ]);
                exportTableToCSV(headers, rows, "low_stock_items");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!lowStock.length) return;
                const headers = ["Item Name", "Type", "Quantity"];
                const rows = lowStock.map(item => [
                  item.name || '',
                  item.type || '',
                  item.quantity || 0
                ]);
                exportTableToPDF("Top 5 Low Stock Items", headers, rows, "low_stock_items");
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>`;

content = content.replace(oldButtonRegex, newButtons);
fs.writeFileSync(path, content);
console.log('InventoryReportsPage updated');
