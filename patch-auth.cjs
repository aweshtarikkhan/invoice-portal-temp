const fs = require('fs');

// Patch SupportTicketsPage
let ticketsCode = fs.readFileSync('src/pages/SupportTicketsPage.tsx', 'utf8');
ticketsCode = ticketsCode.replace(
  'import { useAuth } from "@/hooks/useAuth";',
  'import { useAppStore } from "@/store/app-store";'
);
ticketsCode = ticketsCode.replace(
  'const { org, user } = useAuth();',
  'const org = useAppStore((s) => s.organization);\n  const user = useAppStore((s) => s.user);'
);
fs.writeFileSync('src/pages/SupportTicketsPage.tsx', ticketsCode);

// Patch CRMCalendarPage
let calCode = fs.readFileSync('src/pages/CRMCalendarPage.tsx', 'utf8');
calCode = calCode.replace(
  'import { useAuth } from "@/hooks/useAuth";',
  'import { useAppStore } from "@/store/app-store";'
);
calCode = calCode.replace(
  'const { org } = useAuth();',
  'const org = useAppStore((s) => s.organization);'
);
fs.writeFileSync('src/pages/CRMCalendarPage.tsx', calCode);

console.log("Fixed useAuth imports");
