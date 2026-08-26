const fs = require('fs');
const path = 'src/components/layout/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add toggleGroup function
if (!content.includes('const toggleGroup =')) {
  content = content.replace(
    /const currentUserEmail = session\?\.user\?\.email\?\.toLowerCase\(\)\.trim\(\);/,
    `const toggleGroup = (key: string, isOpen: boolean) => {
    setOpenGroups(prev => ({ ...prev, [key]: !isOpen }));
    if (!isOpen) {
      setTimeout(() => {
        const el = document.getElementById(\`group-\${key}\`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  };

  const currentUserEmail = session?.user?.email?.toLowerCase().trim();`
  );
}

// Replace setOpenGroups calls
content = content.replace(
  /onClick=\{\(\) => setOpenGroups\(prev => \(\{ \.\.\.prev, \[g\.key\]: !isOpen \}\)\)\}/g,
  `onClick={() => toggleGroup(g.key, isOpen)}`
);

content = content.replace(
  /onClick=\{\(\) => setOpenGroups\(prev => \(\{ \.\.\.prev, \[sub\.key\]: !isSubOpen \}\)\)\}/g,
  `onClick={() => toggleGroup(sub.key, isSubOpen)}`
);

// Add ids to SidebarGroup and subgroups
content = content.replace(
  /<SidebarGroup key=\{g\.key\} className="p-0 mt-2">/g,
  `<SidebarGroup key={g.key} id={\`group-\${g.key}\`} className="p-0 mt-2">`
);

content = content.replace(
  /<div key=\{sub\.key\} className="mt-1">/g,
  `<div key={sub.key} id={\`group-\${sub.key}\`} className="mt-1">`
);

// Update System & Settings
content = content.replace(
  /<SidebarMenuItem>\s*<SidebarMenuButton\s*onClick=\{\(\) => setSettingsOpen\(!settingsOpen\)\}/,
  `<SidebarMenuItem id="group-settings">
                      <SidebarMenuButton
                        onClick={() => {
                          setSettingsOpen(!settingsOpen);
                          if (!settingsOpen) {
                            setTimeout(() => {
                              document.getElementById("group-settings")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 150);
                          }
                        }}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patch complete.');
