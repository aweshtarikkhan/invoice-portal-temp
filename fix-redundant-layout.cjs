const fs = require('fs');

// Patch SupportTicketsPage
let ticketsCode = fs.readFileSync('src/pages/SupportTicketsPage.tsx', 'utf8');
ticketsCode = ticketsCode.replace(
  'import { AppLayout } from "@/components/layout/AppLayout";\n',
  ''
);
ticketsCode = ticketsCode.replace(
  /<AppLayout>/g,
  '<>'
);
ticketsCode = ticketsCode.replace(
  /<\/AppLayout>/g,
  '</>'
);
fs.writeFileSync('src/pages/SupportTicketsPage.tsx', ticketsCode);

// Patch CRMCalendarPage
let calCode = fs.readFileSync('src/pages/CRMCalendarPage.tsx', 'utf8');
calCode = calCode.replace(
  'import { AppLayout } from "@/components/layout/AppLayout";\n',
  ''
);
calCode = calCode.replace(
  /<AppLayout>/g,
  '<>'
);
calCode = calCode.replace(
  /<\/AppLayout>/g,
  '</>'
);
fs.writeFileSync('src/pages/CRMCalendarPage.tsx', calCode);

console.log("Removed redundant AppLayout wrappers");
