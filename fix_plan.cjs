const fs = require('fs');

const files = [
  'src/pages/InvoicesPage.tsx',
  'src/pages/LeadsPage.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (!content.includes('useSubscription')) {
    content = content.replace('import { useAppStore } from "@/store/app-store";', 'import { useAppStore } from "@/store/app-store";\nimport { useSubscription } from "@/hooks/use-subscription";');
    content = content.replace("const plan = org?.subscription_plan || 'free';", "const { subscriptionPlan } = useSubscription();\n  const plan = subscriptionPlan || org?.subscription_plan || 'free';");
    content = content.replace("const isFreePlan = plan === 'free';", "const isFreePlan = plan.toLowerCase() === 'free';");
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  }
});
