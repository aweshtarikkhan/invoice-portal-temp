const fs = require('fs');

const path = 'src/pages/SalesReportsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('exportTableToCSV')) {
  content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";');
}

const oldButtonRegex = /<Button[\s\S]*?Export CSV[\s\S]*?<\/Button>/;
const newButtons = `<div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!topClients.length) return;
                const headers = ["Rank", "Client Name", "Total Revenue"];
                const rows = topClients.map((cl, i) => [
                  i + 1,
                  cl.name || '',
                  cl.total || 0
                ]);
                exportTableToCSV(headers, rows, "top_clients");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!topClients.length) return;
                const headers = ["Rank", "Client Name", "Total Revenue"];
                const rows = topClients.map((cl, i) => [
                  i + 1,
                  cl.name || '',
                  fmt(cl.total || 0)
                ]);
                exportTableToPDF("Top 5 Clients by Revenue", headers, rows, "top_clients");
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>`;

content = content.replace(oldButtonRegex, newButtons);
fs.writeFileSync(path, content);
console.log('SalesReportsPage updated');
