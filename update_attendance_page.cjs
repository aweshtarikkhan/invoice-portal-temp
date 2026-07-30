const fs = require('fs');
let content = fs.readFileSync('src/pages/AttendancePage.tsx', 'utf8');

// We will add Tabs from shadcn
if (!content.includes('Tabs, TabsContent, TabsList, TabsTrigger')) {
  content = content.replace(
    'import { Button } from "@/components/ui/button";',
    'import { Button } from "@/components/ui/button";\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";'
  );
  content = content.replace(
    'import { MapPin, Clock } from "lucide-react";',
    ''
  ); // remove if exists
  content = content.replace(
    'import { ChevronLeft, ChevronRight, Save, Send } from "lucide-react";',
    'import { ChevronLeft, ChevronRight, Save, Send, MapPin, Clock } from "lucide-react";'
  );

  const dailyLogsCode = `
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="monthly">Monthly Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Portal Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="space-y-4">
`;
  
  content = content.replace('<Card>', dailyLogsCode + '<Card>');

  const endOfMonthly = `
        </TabsContent>
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Portal Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">View exact clock-in and clock-out times and GPS locations captured from the Employee Portal.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Location (In)</TableHead>
                    <TableHead>Location (Out)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map(e => {
                    const status = att[\`\${e.id}|\${format(new Date(), "yyyy-MM-dd")}\`] || "absent";
                    // Note: We don't have full raw records fetched in state for this new schema yet in this file's current logic, 
                    // we'll need to fetch clock in/out from supabase for the "daily" tab.
                    // For now, we render a placeholder or a simple list.
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell>{format(new Date(), "yyyy-MM-dd")}</TableCell>
                        <TableCell>{status}</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>--</TableCell>
                        <TableCell>--</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
`;

  content = content.replace('</Card>\n    </div>', '</Card>\n' + endOfMonthly + '\n    </div>');

  // Let's actually fetch raw attendance for the selected month to show real clock in/out
  // The load function already fetches raw records into `atts.data`
  // We can store them in a state
  content = content.replace('const [att, setAtt] = useState<Record<string, Status>>({}); // key: empId|date', 'const [att, setAtt] = useState<Record<string, Status>>({});\n  const [rawAtt, setRawAtt] = useState<any[]>([]);');
  
  content = content.replace('setAtt(map);', 'setAtt(map);\n    setRawAtt(atts.data || []);');

  // Now fix the table
  const newTableBody = `
                <TableBody>
                  {rawAtt.filter(r => r.attendance_date === format(new Date(), "yyyy-MM-dd")).map(r => {
                    const e = employees.find(emp => emp.id === r.employee_id);
                    if (!e) return null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell>{r.attendance_date}</TableCell>
                        <TableCell className="capitalize">{r.status}</TableCell>
                        <TableCell>{r.clock_in_time ? format(new Date(r.clock_in_time), "hh:mm a") : "--"}</TableCell>
                        <TableCell>{r.clock_out_time ? format(new Date(r.clock_out_time), "hh:mm a") : "--"}</TableCell>
                        <TableCell>
                          {r.clock_in_location ? (
                            <a href={\`https://www.google.com/maps/search/?api=1&query=\${r.clock_in_location.lat},\${r.clock_in_location.lng}\`} target="_blank" className="text-blue-600 flex items-center text-xs hover:underline"><MapPin className="h-3 w-3 mr-1"/> View</a>
                          ) : "--"}
                        </TableCell>
                        <TableCell>
                          {r.clock_out_location ? (
                            <a href={\`https://www.google.com/maps/search/?api=1&query=\${r.clock_out_location.lat},\${r.clock_out_location.lng}\`} target="_blank" className="text-blue-600 flex items-center text-xs hover:underline"><MapPin className="h-3 w-3 mr-1"/> View</a>
                          ) : "--"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {rawAtt.filter(r => r.attendance_date === format(new Date(), "yyyy-MM-dd")).length === 0 && (
                     <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No portal logs for today.</TableCell></TableRow>
                  )}
                </TableBody>
`;

  content = content.replace(/<TableBody>[\s\S]*?<\/TableBody>/g, (match) => {
    if (match.includes('rawAtt')) return match; // if somehow matched the second one
    if (match.includes('format(new Date(), "yyyy-MM-dd")')) return newTableBody; // target the second one
    return match; // keep the first one
  });

  fs.writeFileSync('src/pages/AttendancePage.tsx', content);
}
