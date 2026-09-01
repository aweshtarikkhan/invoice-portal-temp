const fs = require('fs');

let sidebar = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// 1. Remove Emails and WhatsApp Chats from salesItems
sidebar = sidebar.replace(/\s*\{\s*title:\s*"Emails",\s*url:\s*"\/emails"[\s\S]*?\},/g, '');
sidebar = sidebar.replace(/\s*\{\s*title:\s*"WhatsApp\sChats",\s*url:\s*"\/chats"[\s\S]*?\},/g, '');

// 2. Add outreachItems before defaultGroups
const outreachDef = `  const outreachItems = [
    { title: "Emails", url: "/emails", icon: Send, addUrl: null },
    { title: "WhatsApp Chats", url: "/chats", icon: MessageCircle, addUrl: null },
  ];

  // Default groups`;

sidebar = sidebar.replace(/\/\/\s*Default groups/, outreachDef);

// 3. Add outreach group to defaultGroups
sidebar = sidebar.replace(
  /(const defaultGroups = \[)/,
  `$1\n      { key: "outreach", label: "Customer Outreach", items: outreachItems },`
);

// 4. Add icon for outreach
sidebar = sidebar.replace(
  /(\{g\.key === "reports" && <BarChart3 className="h-5 w-5 opacity-70 group-hover\/groupbtn:opacity-100" \/>\})/,
  `$1\n                      {g.key === "outreach" && <MessageCircle className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}`
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', sidebar, 'utf8');
console.log('AppSidebar patched with Customer Outreach group!');
