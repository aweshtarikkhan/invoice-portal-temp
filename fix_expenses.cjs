const fs = require('fs');
let c = fs.readFileSync('src/pages/BusinessExpensesPage.tsx', 'utf8');

if (!c.includes('ImportDialog')) {
  c = `import { ImportDialog, ImportField } from "@/components/shared/ImportDialog";\n` + c;
}

if (!c.includes('const [importOpen, setImportOpen]')) {
  c = c.replace('const [dialogOpen, setDialogOpen] = useState(false);', 'const [dialogOpen, setDialogOpen] = useState(false);\n  const [importOpen, setImportOpen] = useState(false);');
}

if (!c.includes('const expenseImportFields: ImportField[]')) {
  const fields = `
const expenseImportFields: ImportField[] = [
  { key: "category", label: "Category", required: true },
  { key: "description", label: "Description" },
  { key: "amount", label: "Amount", required: true },
  { key: "expense_date", label: "Date", required: true },
  { key: "is_recurring", label: "Is Recurring (Yes/No)" },
  { key: "recurring_frequency", label: "Frequency (e.g. monthly)" },
];
`;
  c = c.replace('const emptyForm = {', fields + '\nconst emptyForm = {');
}

if (!c.includes('setImportOpen(true)')) {
  c = c.replace(
    '<Download className="h-4 w-4 mr-2" /> Export CSV\n          </Button>',
    '<Download className="h-4 w-4 mr-2" /> Export CSV\n          </Button>\n          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>\n            <Database className="h-4 w-4 mr-2" /> Import\n          </Button>'
  );
}

if (!c.includes('entityName="Expenses"')) {
  const importUI = `
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={expenseImportFields}
        entityName="Expenses"
        onImport={async (rows) => {
          let success = 0, errors = 0;
          const failedRows: any[] = [];
          for (const row of rows) {
            const { error } = await supabase.from("business_expenses").insert({
              org_id: org?.id,
              category: row.category,
              description: row.description || null,
              amount: parseFloat(row.amount) || 0,
              expense_date: row.expense_date || new Date().toISOString(),
              is_recurring: row.is_recurring?.toLowerCase() === "yes" || row.is_recurring?.toLowerCase() === "true",
              recurring_frequency: row.recurring_frequency || null
            });
            if (error) { errors++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else success++;
          }
          loadData();
          return { success, errors, failedRows };
        }}
      />
  `;
  c = c.replace('</PageActionBar>', '</PageActionBar>\n' + importUI);
}

fs.writeFileSync('src/pages/BusinessExpensesPage.tsx', c);
console.log('Added ImportDialog to BusinessExpensesPage');
