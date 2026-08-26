const fs = require('fs');

const path = 'src/components/layout/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Lock icon import
if (!content.includes('Lock')) {
  content = content.replace('LogOut,', 'LogOut,\n  Lock,');
}

// 2. Modify defaultGroups
content = content.replace(
  /const defaultGroups = \[\s*\{ key: "sales", label: "Sales", items: salesItems.filter\(i => i.title !== "WhatsApp Chats" \|\| userRole === 'admin' \|\| userRole === 'owner' \|\| userPermissions.includes\('whatsapp_access'\)\) \},\s*\{ key: "catalog", label: "Inventory Management", items: catalogVisible \},\s*\]\.filter\(g => isGroupEnabled\(g.key\) && isGroupAccessible\(g.key\) && platformFeatures.includes\(g.key\)\);/,
  `const defaultGroups = [
    { key: "sales", label: "Sales", items: salesItems.filter(i => i.title !== "WhatsApp Chats" || userRole === 'admin' || userRole === 'owner' || userPermissions.includes('whatsapp_access')) },
    { key: "catalog", label: "Inventory Management", items: catalogVisible },
  ].map(g => ({ ...g, isLocked: !isGroupEnabled(g.key) }));`
);

// 3. Modify featureGroups
content = content.replace(
  /const featureGroups = ADMIN_FEATURE_GROUPS\s*\.filter\(\(g\) => g\.key !== "sales" && g\.key !== "catalog" && isGroupEnabled\(g\.key\) && isGroupAccessible\(g\.key\) && platformFeatures\.includes\(g\.key\)\)\s*\.map\(\(g\) => \{/g,
  `const featureGroups = ADMIN_FEATURE_GROUPS
    .filter((g) => g.key !== "sales" && g.key !== "catalog")
    .map((g) => {`
);

content = content.replace(
  /return \{\s*key: g\.key,\s*label: g\.label,\s*items: g\.items\.map/g,
  `return {
        key: g.key,
        label: g.label,
        isLocked: !isGroupEnabled(g.key),
        items: g.items.map`
);

// 4. Update the render for groups
content = content.replace(
  /\{!collapsed && <span className="flex-1 font-medium text-slate-300 group-hover\/groupbtn:text-white tracking-wide text-sm ml-2">\{t\(g\.label\)\}<\/span>\}/g,
  `{!collapsed && (
                        <span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2 flex items-center justify-between pr-2">
                          {t(g.label)}
                          {g.isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" title="Upgrade to use this feature" />}
                        </span>
                      )}`
);

// 5. Update the render for subGroups
content = content.replace(
  /<span className="flex-1 text-sm">\{t\(sub\.label\)\}<\/span>/g,
  `<span className="flex-1 text-sm flex items-center justify-between pr-2">
                                     {t(sub.label)}
                                     {sub.isLocked && <Lock className="h-3 w-3 text-amber-500" title="Upgrade to use this feature" />}
                                   </span>`
);

// We need to also lock the items themselves if the group is locked.
// Actually, if we just set a title and a disabled class on the group or items.
// For now, let's just make the items non-clickable or give them a title if their parent is locked.
content = content.replace(
  /className="hover:bg-\[#1e293b\] hover:text-white transition-colors h-9 rounded-lg"/g,
  'className={`hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg ${g.isLocked ? "opacity-50 cursor-not-allowed" : ""}`} title={g.isLocked ? "Upgrade to use this feature" : undefined} onClick={(e) => { if(g.isLocked) e.preventDefault(); }}'
);

content = content.replace(
  /className="hover:bg-\[#1e293b\] hover:text-white transition-colors h-9 rounded-lg pl-6"/g,
  'className={`hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg pl-6 ${sub.isLocked ? "opacity-50 cursor-not-allowed" : ""}`} title={sub.isLocked ? "Upgrade to use this feature" : undefined} onClick={(e) => { if(sub.isLocked) e.preventDefault(); }}'
);

fs.writeFileSync(path, content, 'utf8');
console.log('AppSidebar patched!');
