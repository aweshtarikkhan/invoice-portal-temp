const fs = require('fs');

// 1. Remove from AppSidebar
let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// We injected outreachItems like this:
// const outreachItems = [ ... ];
// // Default groups
sidebar = sidebar.replace(/const outreachItems = \[\s*\{\s*title: "Emails"[\s\S]*?\/\/\s*Default groups/g, '// Default groups');

// And we injected { key: "outreach", label: "Customer Outreach", items: outreachItems },
sidebar = sidebar.replace(/\s*\{\s*key:\s*"outreach",\s*label:\s*"Customer\sOutreach",\s*items:\s*outreachItems\s*\},/g, '');

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar, 'utf8');

// 2. Add to feature-store.ts
let store = fs.readFileSync('src/store/feature-store.ts', 'utf8');
const outreachGroup = `  {
    key: "outreach",
    label: "Customer Outreach",
    icon: "MessageCircle",
    description: "Emails & WhatsApp Chats",
    items: [
      { key: "emails", title: "Emails", description: "Send emails to customers", icon: "Send", url: "/emails" },
      { key: "chats", title: "WhatsApp Chats", description: "Chat with customers", icon: "MessageCircle", url: "/chats" },
    ],
  },
];`;

store = store.replace(/];\s*$/, outreachGroup + '\n');
fs.writeFileSync('src/store/feature-store.ts', store, 'utf8');

console.log('Moved outreach to ADMIN_FEATURE_GROUPS');
