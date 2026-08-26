const fs = require('fs');
const path = 'src/components/layout/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update isSettingsActive
content = content.replace(
  /const isSettingsActive = settingsItems\.some\(\s*\(item\) => location\.pathname === item\.url \|\| location\.pathname\.startsWith\(item\.url \+ "\/"\)\s*\);/,
  `const isSettingsActive = settingsItems.some(
    (item) => location.pathname === item.url || location.pathname.startsWith(item.url + "/")
  ) || location.pathname === "/admin" || location.pathname.startsWith("/admin/");`
);

// Delete old admin link block
content = content.replace(
  /\s*\{\/\* Admin Panel link - hidden from staff \*\/\}\s*\{userRole !== 'staff' && \(\s*<SidebarMenuItem className="mt-2">\s*<SidebarMenuButton asChild isActive=\{isActive\("\/admin"\)\} tooltip=\{t\("Business Settings"\)\}>\s*<NavLink\s*to="\/admin"\s*className="hover:bg-\[#1e293b\] hover:text-white rounded-lg transition-colors py-5"\s*activeClassName="bg-blue-600 text-white font-medium shadow-md shadow-blue-600\/20"\s*>\s*<Shield className="h-5 w-5" \/>\s*\{!collapsed && <span className="ml-2 text-sm">\{t\("Business Settings"\)\}<\/span>\}\s*<\/NavLink>\s*<\/SidebarMenuButton>\s*<\/SidebarMenuItem>\s*\)\}/,
  ""
);

// Update rendering of settings items to include the admin link
content = content.replace(
  /\{\(settingsOpen \|\| isSettingsActive\) && settingsItems\.map\(\(item\) => \([\s\S]*?<\/SidebarMenuItem>\s*\)\)\}/,
  `{(settingsOpen || isSettingsActive) && (
                    <>
                      {settingsItems.map((item) => (
                        <SidebarMenuItem key={item.title} className={\`mt-1 \${collapsed ? 'pl-0 flex justify-center' : 'pl-6'}\`}>
                          <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={collapsed ? t(item.title) : undefined}>
                            <NavLink
                              to={item.url}
                              className={\`hover:bg-[#1e293b] hover:text-white rounded-lg transition-colors py-4 text-slate-400 \${collapsed ? 'justify-center items-center w-10 h-10 mx-auto' : ''}\`}
                              activeClassName="bg-blue-600/10 text-blue-400 font-medium"
                            >
                              {collapsed ? (
                                item.icon && <item.icon className="h-4 w-4 shrink-0" />
                              ) : (
                                <span className="text-sm">{t(item.title)}</span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      {userRole !== 'staff' && (
                        <SidebarMenuItem className={\`mt-1 \${collapsed ? 'pl-0 flex justify-center' : 'pl-6'}\`}>
                          <SidebarMenuButton asChild isActive={isActive("/admin")} tooltip={collapsed ? t("Business Settings") : undefined}>
                            <NavLink
                              to="/admin"
                              className={\`hover:bg-[#1e293b] hover:text-white rounded-lg transition-colors py-4 text-slate-400 \${collapsed ? 'justify-center items-center w-10 h-10 mx-auto' : ''}\`}
                              activeClassName="bg-blue-600/10 text-blue-400 font-medium"
                            >
                              {collapsed ? (
                                <Shield className="h-4 w-4 shrink-0" />
                              ) : (
                                <span className="text-sm">{t("Business Settings")}</span>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </>
                  )}`
);

fs.writeFileSync(path, content, 'utf8');
console.log("AppSidebar patched successfully.");
