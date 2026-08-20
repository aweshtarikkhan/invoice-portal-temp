const fs = require('fs');

// Patch SupportTicketsPage
let ticketsCode = fs.readFileSync('src/pages/SupportTicketsPage.tsx', 'utf8');
ticketsCode = ticketsCode.replace(
  'import { Layout } from "@/components/Layout";',
  'import { AppLayout } from "@/components/layout/AppLayout";'
);
ticketsCode = ticketsCode.replace(
  /<Layout>/g,
  '<AppLayout>'
);
ticketsCode = ticketsCode.replace(
  /<\/Layout>/g,
  '</AppLayout>'
);
fs.writeFileSync('src/pages/SupportTicketsPage.tsx', ticketsCode);

// Patch CRMCalendarPage
let calCode = fs.readFileSync('src/pages/CRMCalendarPage.tsx', 'utf8');
calCode = calCode.replace(
  'import { Layout } from "@/components/Layout";',
  'import { AppLayout } from "@/components/layout/AppLayout";'
);
calCode = calCode.replace(
  /<Layout>/g,
  '<AppLayout>'
);
calCode = calCode.replace(
  /<\/Layout>/g,
  '</AppLayout>'
);
fs.writeFileSync('src/pages/CRMCalendarPage.tsx', calCode);

console.log("Fixed Layout imports");
