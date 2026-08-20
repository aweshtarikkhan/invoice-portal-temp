const fs = require('fs');

let leadsCode = fs.readFileSync('src/pages/LeadsPage.tsx', 'utf8');

const targetSaveCode = `const { error } = await q;
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      setOpen(false);
      load();
      toast({ title: editId ? "Lead updated" : "Lead added" });
    }`;

// Wait, the formatting might be slightly different in the actual file. Let's find it safely.
const regex = /else\s*{\s*setOpen\(false\);\s*load\(\);\s*toast\(\{ title: editId \? "Lead updated" : "Lead added" \}\);\s*}/;

const replacement = `else {
      setOpen(false);
      load();
      toast({ title: editId ? "Lead updated" : "Lead added" });
      
      // Automation: Welcome Email for New Leads
      if (!editId && payload.email) {
        (supabase as any)
          .from("crm_automations")
          .select("*")
          .eq("org_id", payload.org_id)
          .eq("trigger_event", "lead_created")
          .eq("action_type", "send_email")
          .eq("is_active", true)
          .single()
          .then(({ data: autoData }) => {
            if (autoData) {
              const subject = \`Welcome \${payload.first_name}!\`;
              const html = \`<p>Hi \${payload.first_name},</p><p>Thank you for your interest in our services. A representative will be in touch with you shortly.</p>\`;
              supabase.functions.invoke("send-custom-email", {
                body: { to: payload.email, subject, html }
              });
              
              // Log activity
              (supabase as any).from("activities").insert({
                org_id: payload.org_id,
                lead_id: null,
                activity_type: 'email',
                title: 'Sent Welcome Email (Automated)',
                notes: 'Automatically sent welcome email based on CRM Automations rule.',
                status: 'completed',
                created_by: payload.owner_id
              }).then();
            }
          });
      }
    }`;

leadsCode = leadsCode.replace(regex, replacement);
fs.writeFileSync('src/pages/LeadsPage.tsx', leadsCode);
console.log("Patched LeadsPage.tsx for welcome email automation");
