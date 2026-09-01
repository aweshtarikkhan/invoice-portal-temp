const fs = require('fs');
let content = fs.readFileSync('src/pages/PlatformAdminPage.tsx', 'utf8');

// Add outreach to PLAN_COLORS
content = content.replace(
  /marketing:\s*"[^"]+",/,
  `$&
  plan_outreach: "bg-teal-900/60 text-teal-300",`
);

// Add outreach to PLAN_DISPLAY_NAMES
content = content.replace(
  /plan_6:\s*"Marketing"/,
  `$&,
  plan_outreach: "Customer Outreach"`
);

// Add outreach to availablePlans
content = content.replace(
  /\{\s*id:\s*"plan_6"[^}]+\}\s*/,
  `$&,
      { id: "plan_outreach", label: "💬 Customer Outreach" }`
);

fs.writeFileSync('src/pages/PlatformAdminPage.tsx', content, 'utf8');
console.log('Added Customer Outreach plan to PlatformAdminPage');
