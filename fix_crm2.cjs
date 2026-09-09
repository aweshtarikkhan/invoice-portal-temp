const fs = require('fs');

const path = 'src/pages/CRMMarketingReportsPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add exportFullPagePDF import
if (!content.includes('exportFullPagePDF')) {
  content = content.replace(
    'import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";',
    'import { exportTableToCSV, exportTableToPDF } from "@/lib/exportUtils";\nimport { exportFullPagePDF } from "@/lib/pdfUtils";'
  );
}

// 2. Add leadsList state
if (!content.includes('const [leadsList')) {
  content = content.replace(
    'const [leadsSourceData, setLeadsSourceData] = useState<any[]>([]);',
    'const [leadsSourceData, setLeadsSourceData] = useState<any[]>([]);\n  const [leadsList, setLeadsList] = useState<any[]>([]);'
  );
}

// 3. Save leads in state
if (!content.includes('setLeadsList(leads || [])')) {
  content = content.replace(
    'setLeadsSourceData(sourceData);',
    'setLeadsSourceData(sourceData);\n      setLeadsList(leads || []);'
  );
}

// 4. Update the openOpp logic to completely exclude those without expected_close_date or past dates
content = content.replace(
  /const openOpp = opportunities\?\.filter[\s\S]*?\}\) \|\| \[\];/,
  `const openOpp = opportunities?.filter((o: any) => {
          if (o.status === "won" || o.status === "lost") return false;
          if (!o.expected_close_date) return false; // Hide if no date
          return new Date(o.expected_close_date).getTime() >= new Date().setHours(0,0,0,0);
        }) || [];`
);

// 5. Wrap in id="crm-report-page" and add top level export button
content = content.replace(
  '<div className="space-y-6">',
  `<div className="space-y-6" id="crm-report-page">`
);

content = content.replace(
  /<div>\s*<h1 className="text-2xl font-bold tracking-tight">Promotion Reports<\/h1>\s*<p className="text-muted-foreground">Analyze your promotional campaigns, lead conversions, and outreach performance.<\/p>\s*<\/div>/,
  `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promotion Reports</h1>
          <p className="text-muted-foreground">Analyze your promotional campaigns, lead conversions, and outreach performance.</p>
        </div>
        <Button onClick={() => exportFullPagePDF('crm-report-page', 'crm_full_report')} className="shrink-0" variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export Full Report (PDF)
        </Button>
      </div>`
);

// 6. Fix the table to show Lead Name
content = content.replace(
  /opp\.title \|\| opp\.name \|\| ''/g,
  `\`\${opp.title || opp.name || ''} (\${leadsList.find((l: any) => l.id === opp.lead_id)?.name || 'No Lead'})\``
);

// And in the actual table cell rendering
content = content.replace(
  '<TableCell className="font-medium">{opp.title || opp.name}</TableCell>',
  '<TableCell className="font-medium">{opp.title || opp.name} <span className="text-muted-foreground text-xs block">{leadsList.find((l: any) => l.id === opp.lead_id)?.name || "No Lead"}</span></TableCell>'
);

fs.writeFileSync(path, content);
console.log('Done CRMMarketingReportsPage modifications');
