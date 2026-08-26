const fs = require('fs');

let content = fs.readFileSync('src/pages/LeavesPage.tsx', 'utf8');

const accrueBtnHTML = `        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Request</Button>`;

const accrueBtnHTMLNew = `        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={async () => {
            if (!confirm("Are you sure you want to run the monthly accrual? This will add the monthly allowance to all employees' balances.")) return;
            try {
              toast({ title: "Processing monthly accrual..." });
              for (const emp of employees) {
                for (const t of ["casual", "sick", "paid"]) {
                  const policy = policies.find(p => p.leave_type === t);
                  if (!policy || policy.monthly_accrual <= 0) continue;
                  
                  const { data: bData } = await (supabase as any).from('employee_leave_balances')
                    .select('accrued')
                    .eq('employee_id', emp.id)
                    .eq('leave_type', t)
                    .maybeSingle();
                    
                  const currentAccrued = bData?.accrued || 0;
                  await (supabase as any).from('employee_leave_balances').upsert({
                    org_id: org.id,
                    employee_id: emp.id,
                    leave_type: t,
                    accrued: currentAccrued + policy.monthly_accrual
                  }, { onConflict: 'employee_id,leave_type' });
                }
              }
              toast({ title: "Monthly accrual completed successfully!" });
              load();
            } catch (err: any) {
              toast({ title: "Error during accrual", description: err.message, variant: "destructive" });
            }
          }}><CalendarDays className="h-4 w-4 mr-2" />Run Monthly Accrual</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New Request</Button>
        </div>`;

content = content.replace(accrueBtnHTML, accrueBtnHTMLNew);

if (!content.includes('CalendarDays')) {
  content = content.replace('ClipboardList,', 'ClipboardList, CalendarDays,');
}

fs.writeFileSync('src/pages/LeavesPage.tsx', content, 'utf8');
console.log('patched LeavesPage for monthly accrual');
