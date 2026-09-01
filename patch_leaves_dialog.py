with open('src/pages/LeavesPage.tsx', 'r', encoding='utf-8') as f: code = f.read()
import re
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
code = re.sub(r'      </Dialog>\n    </div>\n  \);\n}', '      </Dialog>' + dialog_code, code)
with open('src/pages/LeavesPage.tsx', 'w', encoding='utf-8') as f: f.write(code)
