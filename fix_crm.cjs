const fs = require('fs');

const path = 'src/pages/CRMMarketingReportsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports
if (!content.includes('exportTableToCSV')) {
  content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";');
}
if (!content.includes('FileText')) {
  content = content.replace('Download } from "lucide-react"', 'Download, FileText } from "lucide-react"');
}

// Fix opportunity filter
content = content.replace(
  'const openOpp = opportunities?.filter((o: any) => o.status !== "won" && o.status !== "lost") || [];',
  `const openOpp = opportunities?.filter((o: any) => {
          if (o.status === "won" || o.status === "lost") return false;
          if (!o.expected_close_date) return true;
          return new Date(o.expected_close_date).getTime() >= new Date().setHours(0,0,0,0);
        }) || [];`
);

// Replace Export Button
const oldButtonRegex = /<Button[\s\S]*?Export CSV[\s\S]*?<\/Button>/;
const newButtons = `<div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!topOpportunities.length) return;
                const headers = ["Opportunity Name", "Amount", "Probability", "Expected Close Date"];
                const rows = topOpportunities.map(opp => [
                  opp.title || opp.name || '',
                  opp.amount || 0,
                  \`\${opp.probability || 0}%\`,
                  opp.expected_close_date ? format(parseISO(opp.expected_close_date), 'MMM d, yyyy') : '-'
                ]);
                exportTableToCSV(headers, rows, "top_opportunities");
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!topOpportunities.length) return;
                const headers = ["Opportunity Name", "Amount", "Probability", "Expected Close Date"];
                const rows = topOpportunities.map(opp => [
                  opp.title || opp.name || '',
                  formatCurrency(opp.amount || 0),
                  \`\${opp.probability || 0}%\`,
                  opp.expected_close_date ? format(parseISO(opp.expected_close_date), 'MMM d, yyyy') : '-'
                ]);
                exportTableToPDF("Top 5 Open Opportunities", headers, rows, "top_opportunities");
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>`;

content = content.replace(oldButtonRegex, newButtons);
fs.writeFileSync(path, content);
console.log('CRMMarketingReportsPage updated');
