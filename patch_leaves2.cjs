const fs = require('fs');

let content = fs.readFileSync('src/pages/LeavesPage.tsx', 'utf8');

const setStatusOld = `  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const leaveReq = rows.find(r => r.id === id);
    const oldStatus = leaveReq?.status;
    
    const { error } = await (supabase as any).from("leaves").update({ status, approved_at: new Date().toISOString() }).eq("id", id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else {
      if (leaveReq && status === "approved" && oldStatus !== "approved") {
        try {
          const { data: bData } = await (supabase as any).from('employee_leave_balances')
            .select('used')
            .eq('employee_id', leaveReq.employee_id)
            .eq('leave_type', leaveReq.leave_type)
            .maybeSingle();
            
          const currentUsed = bData?.used || 0;
          await (supabase as any).from('employee_leave_balances').upsert({
            org_id: org.id,
            employee_id: leaveReq.employee_id,
            leave_type: leaveReq.leave_type,
            used: currentUsed + leaveReq.days
          }, { onConflict: 'employee_id,leave_type' });
          
          toast({ title: "Leave Approved", description: \`Balance deducted by \${leaveReq.days} day(s).\` });
        } catch (e) {
          console.error(e);
        }
      }
      load();
    }
  };`;

const setStatusNew = `  const setStatus = async (id: string, status: "approved" | "rejected") => {
    const leaveReq = rows.find(r => r.id === id);
    const oldStatus = leaveReq?.status;
    if (oldStatus === status) return;
    
    const { error } = await (supabase as any).from("leaves").update({ status, approved_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    
    if (leaveReq) {
      try {
        const { data: bData } = await (supabase as any).from('employee_leave_balances')
          .select('used')
          .eq('employee_id', leaveReq.employee_id)
          .eq('leave_type', leaveReq.leave_type)
          .maybeSingle();
          
        let currentUsed = bData?.used || 0;
        
        if (status === "approved" && oldStatus !== "approved") {
          currentUsed += leaveReq.days;
          toast({ title: "Leave Approved", description: \`Balance deducted by \${leaveReq.days} day(s).\` });
        } else if (oldStatus === "approved" && (status === "rejected" || status === "cancelled")) {
          currentUsed = Math.max(0, currentUsed - leaveReq.days);
          toast({ title: "Leave Rejected", description: \`Balance refunded by \${leaveReq.days} day(s).\` });
        }
        
        await (supabase as any).from('employee_leave_balances').upsert({
          org_id: org.id,
          employee_id: leaveReq.employee_id,
          leave_type: leaveReq.leave_type,
          used: currentUsed
        }, { onConflict: 'employee_id,leave_type' });
        
      } catch (e) {
        console.error(e);
      }
    }
    load();
  };`;

content = content.replace(setStatusOld, setStatusNew);

fs.writeFileSync('src/pages/LeavesPage.tsx', content, 'utf8');
console.log('patched LeavesPage again');
