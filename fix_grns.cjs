const fs = require('fs');
let c = fs.readFileSync('src/pages/GrnsPage.tsx', 'utf8');

if (!c.includes('ImportDialog')) {
  c = `import { ImportDialog, ImportField } from "@/components/shared/ImportDialog";\n` + c;
}

if (!c.includes('const [importOpen, setImportOpen]')) {
  c = c.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [importOpen, setImportOpen] = useState(false);');
}

if (!c.includes('const grnImportFields: ImportField[]')) {
  const fields = `
const grnImportFields: ImportField[] = [
  { key: "grn_number", label: "GRN Number", required: true },
  { key: "received_date", label: "Received Date", required: true },
  { key: "status", label: "Status (draft/received)" },
  { key: "notes", label: "Notes" },
];
`;
  c = c.replace('export default function GrnsPage() {', fields + '\nexport default function GrnsPage() {');
}

if (!c.includes('setImportOpen(true)')) {
  c = c.replace(
    '<Button onClick={() => navigate("/purchases/grn/new")} className="gap-2">',
    '<Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2 mr-2">Import</Button>\n            <Button onClick={() => navigate("/purchases/grn/new")} className="gap-2">'
  );
}

if (!c.includes('entityName="GRNs"')) {
  const importUI = `
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        fields={grnImportFields}
        entityName="GRNs"
        onImport={async (rows) => {
          let success = 0, errors = 0;
          const failedRows: any[] = [];
          for (const row of rows) {
            const { error } = await supabase.from("grns").insert({
              org_id: org?.id,
              grn_number: row.grn_number,
              received_date: row.received_date || new Date().toISOString(),
              status: row.status || "draft",
              notes: row.notes || null
            });
            if (error) { errors++; failedRows.push({ row, reason: error.message || "Failed to insert" }); } else success++;
          }
          fetchGrns();
          return { success, errors, failedRows };
        }}
      />
  `;
  c = c.replace('</Card>', '</Card>\n' + importUI);
}

fs.writeFileSync('src/pages/GrnsPage.tsx', c);
console.log('Added ImportDialog to GrnsPage');
