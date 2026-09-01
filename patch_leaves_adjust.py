import re

with open('src/pages/LeavesPage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update the arrays
code = code.replace('["casual", "sick", "el_pl"]', '["casual", "sick", "el_pl", "comp_off"]')

# 2. Update default policy text
code = code.replace('Casual=12, Sick=5, EL/PL=15 per year.', 'Casual=12, Sick=5, EL/PL=15, Comp-Off=0 per year.')

# 3. Add table header for Comp-Off and Actions
header_search = '<TableHead className="text-center">Earned/PL (Used / Annual)</TableHead>'
header_replace = header_search + '\n                      <TableHead className="text-center">Comp-Off (Used / Accrued)</TableHead>\n                      <TableHead className="text-right">Actions</TableHead>'
code = code.replace(header_search, header_replace)

# 4. We need to add the Actions cell in the map
# Find where the mapping ends.
cell_search = '''                              </TableCell>
                            );
                          })}'''

cell_replace = cell_search + '''
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => {
                              setAdjustForm({ employee_id: emp.id, employee_name: emp.name, leave_type: "comp_off", amount: 1, transaction_type: "credit", description: "", expiry_date: "" });
                              setAdjustOpen(true);
                            }}>Adjust</Button>
                          </TableCell>'''

code = code.replace(cell_search, cell_replace)

# 5. Add state for adjust form
state_search = 'const [savingPolicy, setSavingPolicy] = useState(false);'
state_replace = state_search + '''
    
    // Adjust Balance Form
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [adjustForm, setAdjustForm] = useState<any>({});
'''
code = code.replace(state_search, state_replace)

# 6. Add submit adjust function
func_search = 'const [balances, setBalances] = useState<any[]>([]);'
func_replace = func_search + '''

    const submitAdjust = async () => {
      if (!adjustForm.employee_id || !adjustForm.amount || !adjustForm.leave_type || !adjustForm.transaction_type) {
        toast({ title: "Fill all required fields", variant: "destructive" }); return;
      }
      
      try {
        // Log transaction
        const { error: txError } = await (supabase as any).from("leave_transactions").insert({
          org_id: org?.id,
          employee_id: adjustForm.employee_id,
          leave_type: adjustForm.leave_type,
          amount: adjustForm.amount,
          transaction_type: adjustForm.transaction_type,
          description: adjustForm.description,
          expiry_date: adjustForm.expiry_date || null
        });
        if (txError) throw txError;
        
        // Update balance
        const empBals = balances.find(b => b.employee_id === adjustForm.employee_id && b.leave_type === adjustForm.leave_type);
        const currentAccrued = empBals?.accrued ?? 0;
        const newAccrued = adjustForm.transaction_type === 'credit' ? currentAccrued + Number(adjustForm.amount) : Math.max(0, currentAccrued - Number(adjustForm.amount));
        
        const { error: balError } = await (supabase as any).from("employee_leave_balances").upsert({
          org_id: org?.id,
          employee_id: adjustForm.employee_id,
          leave_type: adjustForm.leave_type,
          accrued: newAccrued,
          used: empBals?.used ?? 0
        }, { onConflict: "employee_id,leave_type" });
        if (balError) throw balError;
        
        toast({ title: "Balance adjusted successfully" });
        setAdjustOpen(false);
        load();
      } catch (err: any) {
        toast({ title: "Adjustment failed", description: err.message, variant: "destructive" });
      }
    };
'''
code = code.replace(func_search, func_replace)

# 7. Add Dialog for Adjust Form right before the last closing div
dialog_code = '''
        {/* === Adjust Balance Dialog === */}
        <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Adjust Leave Balance - {adjustForm.employee_name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Leave Type</Label>
                <Select value={adjustForm.leave_type} onValueChange={(v) => setAdjustForm({ ...adjustForm, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comp_off">Compensatory Off (CO)</SelectItem>
                    <SelectItem value="el_pl">Earned/Privilege (EL/PL)</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Action</Label>
                  <Select value={adjustForm.transaction_type} onValueChange={(v) => setAdjustForm({ ...adjustForm, transaction_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit (Add)</SelectItem>
                      <SelectItem value="deduction">Deduct (Remove)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Days</Label>
                  <Input type="number" min="0.5" step="0.5" value={adjustForm.amount} onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input type="date" value={adjustForm.expiry_date} onChange={(e) => setAdjustForm({ ...adjustForm, expiry_date: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">Leave blank if it does not expire.</p>
              </div>
              <div>
                <Label>Reason / Note</Label>
                <Textarea placeholder="e.g., Worked on Sunday (Aug 22)" value={adjustForm.description} onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
              <Button onClick={submitAdjust}>Save Adjustment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
}
'''
code = code.replace('      </div>\n    );\n  }', dialog_code)

with open('src/pages/LeavesPage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
