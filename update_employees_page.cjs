const fs = require('fs');
const file = 'src/pages/EmployeesPage.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Interface
if (!content.includes('auth_user_id: string | null;')) {
  content = content.replace('is_active: boolean;', 'is_active: boolean;\n  auth_user_id: string | null;');
}

// 2. State
if (!content.includes('const [portalEmp')) {
  content = content.replace('const [form, setForm] = useState<any>(empty);', 'const [form, setForm] = useState<any>(empty);\n  const [portalEmp, setPortalEmp] = useState<any>(null);\n  const [portalEmail, setPortalEmail] = useState("");\n  const [portalPassword, setPortalPassword] = useState("");\n  const [portalLoading, setPortalLoading] = useState(false);');
}

// 3. grantAccess function
if (!content.includes('const grantAccess = async ()')) {
  const func = `
  const grantAccess = async () => {
    if (!portalEmp || !portalEmail || !portalPassword) return;
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(\`\${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-employee\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": \`Bearer \${session?.access_token}\`
        },
        body: JSON.stringify({
          employee_id: portalEmp.id,
          email: portalEmail,
          password: portalPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create portal access");
      toast({ title: "Success", description: "Portal access granted!" });
      setPortalEmp(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };
`;
  content = content.replace('const remove = async (id: string)', func + '\n  const remove = async (id: string)');
}

// 4. Update the "Action" column in table to be larger
content = content.replace('<TableHead className="w-24"></TableHead>', '<TableHead className="w-36 text-right">Actions</TableHead>');

// 5. Add button in row
if (!content.includes('Grant Access')) {
  const buttonCode = `
                      {!e.auth_user_id && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => { setPortalEmp(e); setPortalEmail(e.email || ""); setPortalPassword(""); }}>
                          Grant Access
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" asChild title="Documents">
`;
  content = content.replace('<Button size="icon" variant="ghost" asChild title="Documents">', buttonCode);
}

// 6. Add dialog for portal access
if (!content.includes('Grant Portal Access</DialogTitle>')) {
  const dialogCode = `
      <Dialog open={!!portalEmp} onOpenChange={(o) => !o && setPortalEmp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grant Portal Access</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email for Login</Label>
              <Input value={portalEmail} onChange={(e) => setPortalEmail(e.target.value)} type="email" placeholder="employee@example.com" />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} type="text" placeholder="e.g. Temp@123" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortalEmp(null)}>Cancel</Button>
            <Button onClick={grantAccess} disabled={portalLoading}>{portalLoading ? "Creating..." : "Create Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;
  content = content.replace('</Dialog>\n    </div>', '</Dialog>\n' + dialogCode + '\n    </div>');
}

fs.writeFileSync(file, content);
console.log('EmployeesPage.tsx updated successfully');
