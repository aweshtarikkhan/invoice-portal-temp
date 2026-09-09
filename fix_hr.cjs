const fs = require('fs');

const path = 'src/pages/HRReportsPage.tsx';
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
                  if (!attendance.length) return;
                  const headers = ["Date", "Employee", "Status", "Check In", "Check Out", "Work Hours"];
                  const rows = attendance.map(att => [
                    att.date || '',
                    \`\${att.employees?.first_name || ''} \${att.employees?.last_name || ''}\`.trim(),
                    att.status || '',
                    att.check_in || '',
                    att.check_out || '',
                    att.work_hours || ''
                  ]);
                  exportTableToCSV(headers, rows, "recent_attendance");
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (!attendance.length) return;
                  const headers = ["Date", "Employee", "Status", "Check In", "Check Out", "Work Hours"];
                  const rows = attendance.map(att => [
                    att.date || '',
                    \`\${att.employees?.first_name || ''} \${att.employees?.last_name || ''}\`.trim(),
                    att.status || '',
                    att.check_in || '',
                    att.check_out || '',
                    att.work_hours || ''
                  ]);
                  exportTableToPDF("Recent Attendance", headers, rows, "recent_attendance");
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>`;

content = content.replace(oldButtonRegex, newButtons);
fs.writeFileSync(path, content);
console.log('HRReportsPage updated');
