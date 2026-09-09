const fs = require('fs');

function patchFile(file, operations) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (!content.includes('import { logAudit }')) {
    content = content.replace('import { useAppStore } from "@/store/app-store";', 'import { useAppStore } from "@/store/app-store";\nimport { logAudit } from "@/lib/audit";\nimport { useAuth } from "@/lib/auth";');
    if (!content.includes('const { user } = useAuth();')) {
      content = content.replace('const org = useAppStore((s) => s.organization);', 'const org = useAppStore((s) => s.organization);\n  const { user } = useAuth();');
    }
    changed = true;
  }

  for (const { search, replace } of operations) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Patched ${file}`);
  }
}

// ItemsPage
patchFile('src/pages/ItemsPage.tsx', [
  {
    search: 'toast({ title: "Item added" });',
    replace: 'toast({ title: "Item added" });\n            if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "item", action: "create", description: `Item ${itemForm.name} added` });'
  },
  {
    search: 'toast({ title: "Item updated" });',
    replace: 'toast({ title: "Item updated" });\n            if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "item", entityId: editItem.id, action: "update", description: `Item ${itemForm.name} updated` });'
  },
  {
    search: 'else { toast({ title: `${ids.length} item(s) deleted` }); setSelected(new Set()); }',
    replace: 'else { toast({ title: `${ids.length} item(s) deleted` }); setSelected(new Set()); if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "item", action: "delete", description: `${ids.length} item(s) deleted` }); }'
  }
]);

// EmployeesPage
patchFile('src/pages/EmployeesPage.tsx', [
  {
    search: 'toast({ title: editId ? "Employee updated" : "Employee added" });',
    replace: 'toast({ title: editId ? "Employee updated" : "Employee added" });\n    if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "employee", entityId: savedEmp?.id || editId, action: editId ? "update" : "create", description: `Employee ${payload.first_name} ${payload.last_name} ${editId ? "updated" : "added"}` });'
  },
  {
    search: 'else { toast({ title: "Employee deleted" }); load(); }',
    replace: 'else { toast({ title: "Employee deleted" }); load(); if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "employee", entityId: id, action: "delete", description: `Employee deleted` }); }'
  }
]);

// LeadsPage
patchFile('src/pages/LeadsPage.tsx', [
  {
    search: 'else { toast({ title: `${ids.length} lead(s) deleted` }); setSelected(new Set()); load(); }',
    replace: 'else { toast({ title: `${ids.length} lead(s) deleted` }); setSelected(new Set()); load(); if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "lead", action: "delete", description: `${ids.length} lead(s) deleted` }); }'
  },
  {
    search: 'toast({ title: "Lead created", description: "The lead has been added to the CRM." });',
    replace: 'toast({ title: "Lead created", description: "The lead has been added to the CRM." });\n            if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "lead", action: "create", description: `Lead created` });'
  }
]);

// LeadDetailPage
patchFile('src/pages/LeadDetailPage.tsx', [
  {
    search: 'toast({ title: "Lead updated" });',
    replace: 'toast({ title: "Lead updated" });\n      if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "lead", entityId: id, action: "update", description: `Lead details updated` });'
  },
  {
    search: 'toast({ title: "Converted to Client!" });',
    replace: 'toast({ title: "Converted to Client!" });\n      if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "lead", entityId: id, action: "update", description: `Lead converted to client` });'
  }
]);

// EstimatesPage
patchFile('src/pages/EstimatesPage.tsx', [
  {
    search: 'else { toast({ title: `${ids.length} estimate(s) deleted` }); setSelected(new Set()); load(); }',
    replace: 'else { toast({ title: `${ids.length} estimate(s) deleted` }); setSelected(new Set()); load(); if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "estimate", action: "delete", description: `${ids.length} estimate(s) deleted` }); }'
  }
]);
