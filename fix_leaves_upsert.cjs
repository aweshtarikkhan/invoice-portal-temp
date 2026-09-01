const fs = require('fs');
const file = 'src/pages/LeavesPage.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /\.select\('used'\)/,
  `.select('id, used')`
);

const badUpsert1 = `await (supabase as any).from('employee_leave_balances').upsert({
            org_id: org.id,
            employee_id: leaveReq.employee_id,
            leave_type: leaveReq.leave_type,
            used: currentUsed
          }, { onConflict: 'employee_id,leave_type' });`;

const goodUpdate1 = `if (bData?.id) {
            await (supabase as any).from('employee_leave_balances').update({ used: currentUsed }).eq('id', bData.id);
          } else {
            await (supabase as any).from('employee_leave_balances').insert({
              org_id: org.id,
              employee_id: leaveReq.employee_id,
              leave_type: leaveReq.leave_type,
              used: currentUsed,
              accrued: 0,
              annual_allowance: 0
            });
          }`;

code = code.replace(badUpsert1, goodUpdate1);

const badUpsert2 = `await (supabase as any).from('employee_leave_balances').upsert({
                      org_id: org.id,
                      employee_id: emp.id,
                      leave_type: t,
                      accrued: currentAccrued + policy.monthly_accrual
                    }, { onConflict: 'employee_id,leave_type' });`;
                    
const goodUpdate2 = `if (bData?.id) {
                      await (supabase as any).from('employee_leave_balances').update({ accrued: currentAccrued + policy.monthly_accrual }).eq('id', bData.id);
                    } else {
                      await (supabase as any).from('employee_leave_balances').insert({
                        org_id: org.id,
                        employee_id: emp.id,
                        leave_type: t,
                        used: 0,
                        accrued: currentAccrued + policy.monthly_accrual,
                        annual_allowance: 0
                      });
                    }`;

code = code.replace(/\.select\('accrued'\)/, `.select('id, accrued')`);
code = code.replace(badUpsert2, goodUpdate2);

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed LeavesPage.tsx upserts');
