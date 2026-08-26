const fs = require('fs');

const path = 'src/pages/PlatformAdminPage.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('PopoverContent')) {
  content = content.replace(
    'import { Badge } from "@/components/ui/badge";',
    `import { Badge } from "@/components/ui/badge";\nimport { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";\nimport { Checkbox } from "@/components/ui/checkbox";`
  );
}

// Replace handlePlanChange with handlePlansChange
content = content.replace(
  /const handlePlanChange = async \(orgId: string, plan: string\) => \{\s*await supabase\.rpc\("admin_set_plan", \{\s*p_org_id: orgId,\s*p_plan_name: plan,\s*\}\);\s*fetchDashboardData\(false\);\s*\};/m,
  `const handlePlansChange = async (orgId: string, currentPlans: string[], toggledPlan: string) => {
    let newPlans = currentPlans.includes(toggledPlan) 
      ? currentPlans.filter(p => p !== toggledPlan)
      : [...currentPlans, toggledPlan];
      
    if (newPlans.length === 0) newPlans = ['free'];

    await supabase.rpc("admin_set_plans", {
      p_org_id: orgId,
      p_plan_names: newPlans,
    });
    fetchDashboardData(false);
  };
  
  const availablePlans = [
    { id: "free", label: "🆓 Free" },
    { id: "plan_2", label: "📄 Sales & Inventory" },
    { id: "plan_3", label: "🏢 Business Suite" },
    { id: "plan_4", label: "👥 HRMS" },
    { id: "plan_5", label: "🤝 CRM" },
    { id: "plan_6", label: "📈 Marketing" }
  ];`
);

// Replace Select logic
const oldSelectStart = `<Select value={sub.plan_name} onValueChange={(val) => handlePlanChange(org.id, val)}>`;
const oldSelectEnd = `</Badge>`;

const selectRegex = /<Select value=\{sub\.plan_name\}[\s\S]*?<\/Select>\s*<Badge[\s\S]*?<\/Badge>/;

const newPlanSelector = `<Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[180px] justify-between bg-slate-800 border-slate-700 text-slate-200">
                              <span className="truncate">{(org as any).subscription_plan_names && (org as any).subscription_plan_names.length > 0
                                ? (org as any).subscription_plan_names.map((p: string) => PLAN_DISPLAY_NAMES[p] || p).join(", ")
                                : sub.plan_display_name || PLAN_DISPLAY_NAMES[sub.plan_name] || "Free"}</span>
                              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-3 bg-slate-800 border-slate-700 shadow-xl rounded-xl z-[9999]" align="end">
                            <div className="space-y-3">
                              {availablePlans.map(plan => {
                                const currentPlans = (org as any).subscription_plan_names || (sub.plan_name ? [sub.plan_name] : ['free']);
                                const isChecked = currentPlans.includes(plan.id);
                                return (
                                  <div key={plan.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                      id={\`plan-\${org.id}-\${plan.id}\`} 
                                      checked={isChecked}
                                      onCheckedChange={() => handlePlansChange(org.id, currentPlans, plan.id)}
                                      className="border-slate-500 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                                    />
                                    <label 
                                      htmlFor={\`plan-\${org.id}-\${plan.id}\`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-200 cursor-pointer"
                                    >
                                      {plan.label}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                          {((org as any).subscription_plan_names || [sub.plan_name]).map((p: string) => (
                             <Badge key={p} className={PLAN_COLORS[p] || PLAN_COLORS.free}>
                               {PLAN_DISPLAY_NAMES[p] || p}
                             </Badge>
                          ))}
                        </div>`;

content = content.replace(selectRegex, newPlanSelector);

fs.writeFileSync(path, content, 'utf8');
console.log('PlatformAdminPage patched!');
