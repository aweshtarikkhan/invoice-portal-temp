const fs = require('fs');

let c = fs.readFileSync('src/components/shared/ImportDialog.tsx', 'utf8');

c = c.replace(
  'onImport: (rows: Record<string, any>[]) => Promise<{ success: number; errors: number }>;',
  'onImport: (rows: Record<string, any>[]) => Promise<{ success: number; errors: number; failedRows?: { row: Record<string, any>; reason: string }[] }>;'
);

c = c.replace(
  'const [result, setResult] = useState<{ success: number; errors: number } | null>(null);',
  'const [result, setResult] = useState<{ success: number; errors: number; failedRows?: { row: Record<string, any>; reason: string }[] } | null>(null);'
);

const resultUI = `{step === "result" && result && (
          <div className="space-y-4 text-center py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
            <div>
              <p className="text-lg font-semibold">Import Complete</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <Badge variant="default" className="bg-success/15 text-success">{result.success} imported</Badge>
                {result.errors > 0 && <Badge variant="destructive">{result.errors} failed</Badge>}
              </div>
            </div>`;

const newResultUI = `{step === "result" && result && (
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
`;

c = c.replace(resultUI, newResultUI);

// change done button to Close to imply they can just leave
c = c.replace('<Button onClick={() => handleClose(false)}>Done</Button>', '<Button onClick={() => handleClose(false)}>Close</Button>');

fs.writeFileSync('src/components/shared/ImportDialog.tsx', c);
console.log('ImportDialog updated');
