const fs = require('fs');

let c = fs.readFileSync('src/components/shared/ImportDialog.tsx', 'utf8');

if (!c.includes('renderExtraSettings')) {
  c = c.replace(
    'onTallyImport?: (file: File) => Promise<Record<string, any>[]>;', 
    'onTallyImport?: (file: File) => Promise<Record<string, any>[]>;\n  renderExtraSettings?: () => React.ReactNode;'
  );

  c = c.replace(
    '<DialogFooter>', 
    `{renderExtraSettings && (
              <div className="my-4 p-4 bg-muted/50 rounded-lg border">
                {renderExtraSettings()}
              </div>
            )}
            <DialogFooter>`
  );
  fs.writeFileSync('src/components/shared/ImportDialog.tsx', c);
  console.log('Patched ImportDialog');
}

let inv = fs.readFileSync('src/pages/InvoicesPage.tsx', 'utf8');
if (!inv.includes('dueDateRule')) {
  inv = inv.replace('const [importOpen, setImportOpen] = useState(false);', 'const [importOpen, setImportOpen] = useState(false);\n  const [dueDateRule, setDueDateRule] = useState("30");');
  
  // Replace the due date calculation
  inv = inv.replace(
    'due_date: parseDate(row.due_date) || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],',
    `due_date: parseDate(row.due_date) || (dueDateRule === "0" ? issueDate : new Date(new Date(issueDate).getTime() + parseInt(dueDateRule) * 86400000).toISOString().split("T")[0]),`
  );

  // Add the extra settings prop
  inv = inv.replace(
    'entityName="Invoices"',
    `entityName="Invoices"
        renderExtraSettings={() => (
          <div className="flex flex-col gap-2">
            <Label className="font-semibold">If Due Date is missing in file:</Label>
            <Select value={dueDateRule} onValueChange={setDueDateRule}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Same as Invoice Date</SelectItem>
                <SelectItem value="15">Invoice Date + 15 Days</SelectItem>
                <SelectItem value="30">Invoice Date + 30 Days</SelectItem>
                <SelectItem value="45">Invoice Date + 45 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}`
  );
  fs.writeFileSync('src/pages/InvoicesPage.tsx', inv);
  console.log('Patched InvoicesPage');
}
