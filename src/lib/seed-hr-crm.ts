import { supabase } from "@/integrations/supabase/client";

export async function seedHrCrmData(orgId: string) {
  try {
    // Check if already seeded to prevent duplicates
    const { data: existingLeads } = await supabase.from("leads").select("id").eq("org_id", orgId).limit(1);
    if (existingLeads && existingLeads.length > 0) {
      return; // Already seeded
    }

    const d = (days: number) => new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    
    // HR Demo data creation (Employees, Attendance, Shifts, Documents, Payroll) has been removed
    // as per user request to avoid auto-creating demo employees.

    // 6. Leads
    const { data: leads, error: leadsErr } = await supabase.from("leads").insert([
      { org_id: orgId, name: "John Doe", company: "Acme Corp", email: "john@acme.com", status: "new", estimated_value: 15000, source: "Website" },
      { org_id: orgId, name: "Jane Smith", company: "TechFlow", email: "jane@techflow.com", status: "contacted", estimated_value: 25000, source: "Referral" },
      { org_id: orgId, name: "Mike Johnson", company: "Global Inc", email: "mike@global.com", status: "qualified", estimated_value: 50000, source: "LinkedIn" }
    ]).select();
    if (leadsErr) throw leadsErr;

    // 7. Pipeline (Opportunities)
    // First ensure there are pipeline stages
    let { data: stages } = await supabase.from("pipeline_stages").select("*").eq("org_id", orgId);
    if (!stages || stages.length === 0) {
      await (supabase as any).rpc("seed_default_pipeline", { p_org_id: orgId });
      const { data: newStages } = await supabase.from("pipeline_stages").select("*").eq("org_id", orgId);
      stages = newStages || [];
    }
    
    if (stages && stages.length > 0) {
      const opps = [
        { org_id: orgId, title: "Acme Corp Deal", amount: 15000, stage_id: stages[0].id, expected_close_date: d(-10), probability: 20 },
        { org_id: orgId, title: "TechFlow Contract", amount: 25000, stage_id: stages[1]?.id || stages[0].id, expected_close_date: d(-5), probability: 50 }
      ];
      await supabase.from("opportunities").insert(opps);
    }

    // 8. Activities (For the first lead)
    if (leads && leads.length > 0) {
      await supabase.from("activities").insert([
        { org_id: orgId, lead_id: leads[0].id, type: "call", title: "Introductory Call", status: "completed", due_date: d(1), notes: "Had a great intro call, they are interested." },
        { org_id: orgId, lead_id: leads[1].id, type: "email", title: "Follow-up Email", status: "pending", due_date: d(-1) }
      ]);
    }

    // Seed complete without reload
    console.log("HR and CRM demo data has been added successfully.");
  } catch (error: any) {
    console.error("Seed error:", error);
  }
}
