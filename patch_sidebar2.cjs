const fs = require('fs');

const path = 'src/components/layout/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Lock,')) {
  content = content.replace('LogOut,', 'LogOut,\n  Lock,');
}

// Replace defaultGroups logic
content = content.replace(
  /const defaultGroups = \[\s*\{ key: "sales", label: "Sales", items: salesItems\.filter\(i => i\.title !== "WhatsApp Chats" \|\| userRole === 'admin' \|\| userRole === 'owner' \|\| userPermissions\.includes\('whatsapp_access'\)\) \},\s*\{ key: "catalog", label: "Inventory Management", items: catalogVisible \},\s*\]\.filter\(g => isGroupEnabled\(g\.key\) && isGroupAccessible\(g\.key\) && platformFeatures\.includes\(g\.key\)\);/,
  `const defaultGroups = [
    { key: "sales", label: "Sales", items: salesItems.filter(i => i.title !== "WhatsApp Chats" || userRole === 'admin' || userRole === 'owner' || userPermissions.includes('whatsapp_access')) },
    { key: "catalog", label: "Inventory Management", items: catalogVisible },
  ].map(g => ({ ...g, isLocked: !isGroupEnabled(g.key) || !platformFeatures.includes(g.key) }));`
);

// Replace featureGroups logic
content = content.replace(
  /const featureGroups = ADMIN_FEATURE_GROUPS\s*\n\s*\.filter\(\(g\) => g\.key !== "sales" && g\.key !== "catalog" && isGroupEnabled\(g\.key\) && isGroupAccessible\(g\.key\) && platformFeatures\.includes\(g\.key\)\)/,
  `const featureGroups = ADMIN_FEATURE_GROUPS
    .filter((g) => g.key !== "sales" && g.key !== "catalog")`
);

// We need to inject isLocked into featureGroups mapping
content = content.replace(
  /return \{\s*key: g\.key,\s*label: g\.label,/g,
  `return {
        key: g.key,
        label: g.label,
        isLocked: !isGroupEnabled(g.key) || !platformFeatures.includes(g.key),`
);

// Replace the render for groups
content = content.replace(
  /\{!collapsed && <span className="flex-1 font-medium text-slate-300 group-hover\/groupbtn:text-white tracking-wide text-sm ml-2">\{t\(g\.label\)\}<\/span>\}/g,
  `{!collapsed && (
                        <span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2 flex items-center justify-between pr-2">
                          {t(g.label)}
                          {(g as any).isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" title="Upgrade to use this feature" />}
                        </span>
                      )}`
);

// Replace the render for subGroups
content = content.replace(
  /<span className="flex-1 text-sm">\{t\(sub\.label\)\}<\/span>/g,
  `<span className="flex-1 text-sm flex items-center justify-between pr-2">
                                     {t(sub.label)}
                                     {(sub as any).isLocked && <Lock className="h-3 w-3 text-amber-500" title="Upgrade to use this feature" />}
                                   </span>`
);

// Replace the render for individual items
content = content.replace(
  /className="hover:bg-\[#1e293b\] hover:text-white transition-colors h-9 rounded-lg"/g,
  'className={`hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg ${(g as any).isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`} title={(g as any).isLocked ? "Upgrade to use this feature" : undefined} onClick={(e) => { if((g as any).isLocked) e.preventDefault(); }}'
);

content = content.replace(
  /className="hover:bg-\[#1e293b\] hover:text-white transition-colors h-9 rounded-lg pl-6"/g,
  'className={`hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg pl-6 ${(sub as any).isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`} title={(sub as any).isLocked ? "Upgrade to use this feature" : undefined} onClick={(e) => { if((sub as any).isLocked) e.preventDefault(); }}'
);


fs.writeFileSync(path, content, 'utf8');
console.log('AppSidebar patched!');
