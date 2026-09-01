const fs = require('fs');
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

store = store.replace(/\{ key: "statements"[^\}]+(?:\n\s*)?\},(?:\n\s*)?\],(?:\n\s*)?\},(?:\n\s*)?\];/, (match) => {
  return match.replace(/];/, outreachGroup);
});

fs.writeFileSync('src/store/feature-store.ts', store, 'utf8');
console.log('Fixed feature-store.ts');
