const fs = require('fs');

let code = fs.readFileSync('src/pages/BankAccountDetailPage.tsx', 'utf8');

// 1. Add some state for the "Create" tab in the Match Dialog
const importsRegex = /import { formatCurrency } from "@\/lib\/currency";/g;
if (!code.includes('createMatchForm')) {
  code = code.replace(importsRegex, `import { formatCurrency } from "@/lib/currency";
const EXPENSE_CATEGORIES = [
  "Office Supplies", "Rent", "Utilities", "Software Subscriptions",
  "Travel", "Meals & Entertainment", "Marketing", "Bank Fees",
  "Contractors", "Other"
];
const INCOME_CATEGORIES = ["Sales", "Interest Income", "Refund", "Other Income"];
`);
}

const stateRegex = /const \[matchOpen, setMatchOpen\] = useState<any>\(null\);/g;
if (!code.includes('createMatchForm')) {
  code = code.replace(stateRegex, `const [matchOpen, setMatchOpen] = useState<any>(null);
  const [matchTab, setMatchTab] = useState("find");
  const [createMatchForm, setCreateMatchForm] = useState({ category: "", description: "" });

  const handleCreateAndMatch = async () => {
    if (!matchOpen || !createMatchForm.category) return;
    
    if (matchOpen.direction === "debit") {
      // Create Expense
      const { data, error } = await (supabase as any).from("business_expenses").insert({
        org_id: org!.id,
        category: createMatchForm.category,
        description: createMatchForm.description || matchOpen.description,
        amount: Math.abs(Number(matchOpen.amount)),
        expense_date: matchOpen.txn_date,
        is_recurring: false
      }).select("id").single();
      
      if (!error && data) {
        await linkMatch(matchOpen, "expense", data.id);
        toast({ title: "Expense created & reconciled" });
      }
    } else {
      // Create Income (Mocking as a journal entry conceptually, or just marking reconciled manually)
      await (supabase as any).from("bank_transactions").update({
        reconciled: true, reconciled_at: new Date().toISOString(),
        matched_type: "manual_income", matched_id: null,
        notes: \`Category: \${createMatchForm.category}\`
      }).eq("id", matchOpen.id);
      
      toast({ title: "Income recorded & reconciled" });
      setMatchOpen(null);
      load();
    }
  };
`);
}

// 2. Modify the Match Dialog rendering
const dialogMatchRegex = /<DialogHeader>[\s\S]*?<DialogTitle>Match Transaction<\/DialogTitle>[\s\S]*?<\/DialogHeader>[\s\S]*?\{matchOpen && \([\s\S]*?<div className="space-y-2 max-h-96 overflow-auto">[\s\S]*?\{suggestions\(matchOpen\)\.map[\s\S]*?<\/div>[\s\S]*?\)\}/g;

if (!code.includes('value="find"')) {
  // Using a custom string replacement strategy for safety
  const oldDialog = `<DialogTitle>Match Transaction</DialogTitle>
            {matchOpen && <div className="text-sm text-muted-foreground">{format(new Date(matchOpen.txn_date), "dd MMM yyyy")} • {matchOpen.description} • {matchOpen.direction === "credit" ? "+" : "-"}{formatCurrency(Number(matchOpen.amount), cur)}</div>}
          </DialogHeader>
          {matchOpen && (
            <div className="space-y-2 max-h-96 overflow-auto">
              {suggestions(matchOpen).map((s: any) => (
                <div key={\`\${s.kind}-\${s.id}\`} className="flex items-center justify-between p-2 border rounded hover:bg-muted">
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.kind} • {format(new Date(s.date), "dd MMM yyyy")} • {formatCurrency(s.amount, cur)} {s.ref && \`• \${s.ref}\`}</div>
                  </div>
                  <Button size="sm" onClick={() => linkMatch(matchOpen, s.kind, s.id)}>Match</Button>
                </div>
              ))}
              {!suggestions(matchOpen).length && <div className="text-sm text-muted-foreground text-center py-6">No matching {matchOpen.direction === "credit" ? "payments received" : "bill payments / expenses"} found. Try marking it reconciled manually if it's a one-off entry.</div>}
            </div>
          )}`;
          
  const newDialog = `<DialogTitle>Match or Create Transaction</DialogTitle>
            {matchOpen && (
              <div className="bg-slate-50 p-3 rounded-lg border flex items-center justify-between">
                <div>
                  <div className="font-medium">{format(new Date(matchOpen.txn_date), "dd MMM yyyy")}</div>
                  <div className="text-sm text-muted-foreground">{matchOpen.description}</div>
                </div>
                <div className={\`text-lg font-semibold \${matchOpen.direction === "credit" ? "text-emerald-600" : "text-red-600"}\`}>
                  {matchOpen.direction === "credit" ? "+" : "-"}{formatCurrency(Number(matchOpen.amount), cur)}
                </div>
              </div>
            )}
          </DialogHeader>
          {matchOpen && (
            <Tabs value={matchTab} onValueChange={setMatchTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="find">Find Match</TabsTrigger>
                <TabsTrigger value="create">Create New</TabsTrigger>
              </TabsList>
              
              <TabsContent value="find" className="space-y-2 mt-4 max-h-80 overflow-auto">
                {suggestions(matchOpen).map((s: any) => (
                  <div key={\`\${s.kind}-\${s.id}\`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="text-sm font-semibold">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                        <Badge variant="outline" className="text-[10px] uppercase font-normal">{s.kind}</Badge>
                        <span>{format(new Date(s.date), "dd MMM yyyy")}</span>
                        <span>•</span>
                        <span className="font-medium">{formatCurrency(s.amount, cur)}</span>
                        {s.ref && <span>• {s.ref}</span>}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => linkMatch(matchOpen, s.kind, s.id)}>Match</Button>
                  </div>
                ))}
                {!suggestions(matchOpen).length && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No exact matches found. <br /> Switch to "Create New" to add it to your books.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={createMatchForm.category} onValueChange={v => setCreateMatchForm({...createMatchForm, category: v})}>
                    <SelectTrigger><SelectValue placeholder="Select account/category" /></SelectTrigger>
                    <SelectContent>
                      {(matchOpen.direction === "debit" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description / Who</Label>
                  <Input 
                    placeholder={matchOpen.description} 
                    value={createMatchForm.description} 
                    onChange={e => setCreateMatchForm({...createMatchForm, description: e.target.value})} 
                  />
                  <p className="text-xs text-muted-foreground">Defaults to bank statement description if left blank.</p>
                </div>
                <Button className="w-full" onClick={handleCreateAndMatch} disabled={!createMatchForm.category}>
                  {matchOpen.direction === "debit" ? "Create Expense & Match" : "Record Income & Match"}
                </Button>
              </TabsContent>
            </Tabs>
          )}`;
          
  code = code.replace(oldDialog, newDialog);
}

fs.writeFileSync('src/pages/BankAccountDetailPage.tsx', code);
console.log("Patched BankAccountDetailPage");
