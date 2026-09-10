const fs = require('fs');
let c = fs.readFileSync('src/components/shared/ImportDialog.tsx', 'utf8');

const start = c.indexOf('{step === "result"');
const end = c.indexOf('</DialogContent>');

if (start !== -1 && end !== -1) {
  const before = c.substring(0, start);
  const after = c.substring(end);
  const newUI = `{step === "result" && result && (
          <div className="space-y-4 py-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
              <p className="text-lg font-semibold mt-2">Import Complete</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <Badge variant="default" className="bg-success/15 text-success">{result.success} imported</Badge>
                {result.errors > 0 && <Badge variant="destructive">{result.errors} failed</Badge>}
              </div>
            </div>
            
            {result.failedRows && result.failedRows.length > 0 && (
              <div className="mt-6 border rounded-md">
                <div className="bg-muted px-4 py-2 border-b">
                  <h4 className="text-sm font-semibold text-destructive">Failed Entries</h4>
                </div>
                <div className="max-h-48 overflow-y-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.failedRows.map((f, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs text-destructive font-medium">{f.reason}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={JSON.stringify(f.row)}>
                            {Object.values(f.row).filter(Boolean).join(", ")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            <DialogFooter className="justify-end pt-4">
              <Button onClick={() => handleClose(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      `;
  
  fs.writeFileSync('src/components/shared/ImportDialog.tsx', before + newUI + after);
  console.log('Successfully replaced result UI');
} else {
  console.log('Could not find start/end bounds');
}
