const fs = require('fs');
let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

if (!c.includes('syncResult')) {
  c = c.replace('const [isProcessing, setIsProcessing] = useState(false);', 'const [isProcessing, setIsProcessing] = useState(false);\n  const [syncResult, setSyncResult] = useState<{ parties: number, invoices: number, payments: number, errors: { reason: string, data: any }[] } | null>(null);');

  const oldSyncLogic = `      toast({
        title: "Sync Complete!",
        description: \`Added \${partiesAdded} parties, \${invoicesAdded} bills/invoices, and \${paymentsAdded} payments.\`,
      });
      setParsedData(null);
      setSyncType(null);`;

  c = c.replace(
    'let paymentsAdded = 0;',
    'let paymentsAdded = 0;\n      const syncErrors: {reason: string, data: any}[] = [];'
  );

  c = c.replace(
    'if (txnError) continue;',
    'if (txnError) { syncErrors.push({ reason: txnError.message || "Failed to create invoice", data: txn.reference }); continue; }'
  );

  c = c.replace(
    'if (lineError) continue;', // just in case
    'if (lineError) { syncErrors.push({ reason: lineError.message || "Failed to create line item", data: it.name }); }'
  );

  c = c.replace(
    'if (payError) continue;', // just in case
    'if (payError) { syncErrors.push({ reason: payError.message || "Failed to create payment", data: txn.reference }); continue; }'
  );

  // We need to also catch payment insert error explicitly since it wasn't caught in the original
  c = c.replace(
    'await supabase.from("payments").insert(payData);',
    'const { error: payErr } = await supabase.from("payments").insert(payData);\n              if (payErr) { syncErrors.push({ reason: payErr.message, data: payData.payment_number }); }'
  );
  c = c.replace(
    'await supabase.from("bill_payments").insert(payData);',
    'const { error: bPayErr } = await supabase.from("bill_payments").insert(payData);\n              if (bPayErr) { syncErrors.push({ reason: bPayErr.message, data: payData.payment_number }); }'
  );

  c = c.replace(
    oldSyncLogic,
    `setSyncResult({ parties: partiesAdded, invoices: invoicesAdded, payments: paymentsAdded, errors: syncErrors });`
  );

  const resultUI = `
      {syncResult && (
        <Card className="mt-6 border-success bg-success/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <div>
                <CardTitle className="text-xl">Sync Complete</CardTitle>
                <CardDescription>Master sync executed successfully</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary">{syncResult.parties}</div>
                <div className="text-xs uppercase text-muted-foreground mt-1">Parties Synced</div>
              </div>
              <div className="p-4 bg-background rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary">{syncResult.invoices}</div>
                <div className="text-xs uppercase text-muted-foreground mt-1">Invoices Synced</div>
              </div>
              <div className="p-4 bg-background rounded-lg border text-center">
                <div className="text-3xl font-bold text-primary">{syncResult.payments}</div>
                <div className="text-xs uppercase text-muted-foreground mt-1">Payments Synced</div>
              </div>
            </div>
            
            {syncResult.errors.length > 0 && (
              <div className="border rounded-md bg-background">
                <div className="bg-destructive/10 px-4 py-2 border-b">
                  <h4 className="text-sm font-semibold text-destructive">Encountered {syncResult.errors.length} Errors</h4>
                </div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                  {syncResult.errors.map((e, i) => (
                    <div key={i} className="text-xs flex gap-2">
                      <span className="font-semibold text-destructive min-w-32">{e.reason}:</span>
                      <span className="text-muted-foreground truncate">{JSON.stringify(e.data)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <Button onClick={() => { setSyncResult(null); setParsedData(null); setSyncType(null); }}>Done</Button>
            </div>
          </CardContent>
        </Card>
      )}
  `;

  c = c.replace('{!parsedData ? (', '{syncResult ? ' + resultUI + ' : !parsedData ? (');

  fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
  console.log('Added SyncResult state to TallySyncPage');
} else {
  console.log('SyncResult already exists');
}
