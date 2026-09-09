const fs = require('fs');

const clientsFile = 'src/pages/ClientsPage.tsx';
let clients = fs.readFileSync(clientsFile, 'utf8');
if (!clients.includes('import { logAudit }')) {
  clients = clients.replace('import { useAppStore } from "@/store/app-store";', 'import { useAppStore } from "@/store/app-store";\nimport { logAudit } from "@/lib/audit";\nimport { useAuth } from "@/lib/auth";');
  
  // Add const { user } = useAuth();
  clients = clients.replace('const org = useAppStore((s) => s.organization);', 'const org = useAppStore((s) => s.organization);\n  const { user } = useAuth();');

  // After insert
  clients = clients.replace(
    'toast({ title: "Client created" });',
    'toast({ title: "Client created" });\n        if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "client", action: "create", description: `Client ${payload.display_name} created` });'
  );

  // After update
  clients = clients.replace(
    'toast({ title: "Client updated" });',
    'toast({ title: "Client updated" });\n        if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "client", entityId: editClient.id, action: "update", description: `Client ${payload.display_name} updated` });'
  );

  // After delete
  clients = clients.replace(
    'else { toast({ title: `${ids.length} client(s) deleted` }); setSelected(new Set()); }',
    'else { toast({ title: `${ids.length} client(s) deleted` }); setSelected(new Set()); if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "client", action: "delete", description: `${ids.length} client(s) deleted` }); }'
  );

  fs.writeFileSync(clientsFile, clients);
  console.log('Patched ClientsPage.tsx');
}

const pipelineFile = 'src/pages/PipelinePage.tsx';
let pipeline = fs.readFileSync(pipelineFile, 'utf8');
if (!pipeline.includes('import { logAudit }')) {
  pipeline = pipeline.replace('import { useAppStore } from "@/store/app-store";', 'import { useAppStore } from "@/store/app-store";\nimport { logAudit } from "@/lib/audit";\nimport { useAuth } from "@/lib/auth";');
  
  pipeline = pipeline.replace('const org = useAppStore((s) => s.organization);', 'const org = useAppStore((s) => s.organization);\n  const { user } = useAuth();');

  // After insert opp
  pipeline = pipeline.replace(
    'else { setOpen(false); load(); toast({ title: editId ? "Opportunity updated" : "Opportunity added" }); }',
    'else { setOpen(false); load(); toast({ title: editId ? "Opportunity updated" : "Opportunity added" }); if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "opportunity", entityId: editId || undefined, action: editId ? "update" : "create", description: `Opportunity ${payload.title} ${editId ? "updated" : "added"}` }); }'
  );

  // After move
  pipeline = pipeline.replace(
    'if (error) { toast({ title: "Move failed", description: error.message, variant: "destructive" }); load(); }',
    'if (error) { toast({ title: "Move failed", description: error.message, variant: "destructive" }); load(); } else { if (org && user) await logAudit({ orgId: org.id, userId: user.id, entityType: "opportunity", entityId: oppId, action: "update", description: `Opportunity moved to stage ${stage?.name || stageId}` }); }'
  );

  fs.writeFileSync(pipelineFile, pipeline);
  console.log('Patched PipelinePage.tsx');
}

