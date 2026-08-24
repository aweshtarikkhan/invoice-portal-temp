
const fs = require("fs");

let content = fs.readFileSync("src/components/layout/AppSidebar.tsx", "utf-8");

// Add Briefcase to imports
content = content.replace("PackageCheck,\n  BookOpen,", "PackageCheck,\n  BookOpen,\n  Briefcase,");

// Add logic to group Sales, Catalog, Purchases, Accounting into Business Management
content = content.replace(
  "const sidebarGroups = [...defaultGroups, ...featureGroups];",
  `  const allGroups = [...defaultGroups, ...featureGroups];
  
  const bmKeys = ["sales", "catalog", "purchases", "accounting"];
  const bmSubGroups = allGroups.filter(g => bmKeys.includes(g.key));
  const otherGroups = allGroups.filter(g => !bmKeys.includes(g.key));
  
  const sidebarGroups = bmSubGroups.length > 0 
    ? [
        { key: "business_management", label: "Business Management", items: [], subGroups: bmSubGroups },
        ...otherGroups
      ]
    : otherGroups;`
);

// Replace the render logic to support subGroups
const renderLogic = `{sidebarGroups.map((g) => {
          const isActiveGroup = g.items.some((item) => isActive(item.url) || (item.addUrl && isActive(item.addUrl))) || g.subGroups?.some(sub => sub.items.some(item => isActive(item.url) || (item.addUrl && isActive(item.addUrl))));
          const isOpen = openGroups[g.key] !== undefined ? openGroups[g.key] : isActiveGroup;

          return (
            <SidebarGroup key={g.key} className="p-0 mt-2">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setOpenGroups(prev => ({ ...prev, [g.key]: !isOpen }))}
                      className="hover:bg-[#1e293b] hover:text-white cursor-pointer h-10 rounded-lg transition-colors py-5 group/groupbtn"
                      tooltip={t(g.label)}
                    >
                      {g.key === "business_management" && <Briefcase className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "sales" && <FileText className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "catalog" && <Package className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "purchases" && <ShoppingCart className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "accounting" && <Calculator className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "people" && <UserCog className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "crm" && <Users className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      {g.key === "marketing" && <Send className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                      
                      {!collapsed && <span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2">{t(g.label)}</span>}
                      {!collapsed && (
                        <ChevronRight className={\`h-4 w-4 text-slate-500 transition-transform \${isOpen ? "rotate-90" : ""}\`} />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  {isOpen && g.items.map((item) => (
                    <SidebarMenuItem key={item.title} className={\`group/item mt-1 \${collapsed ? "pl-0 flex justify-center" : "pl-6"}\`}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={collapsed ? t(item.title) : undefined}>
                        <Link
                          to={item.url}
                          className="hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg"
                        >
                          {collapsed ? (
                            <item.icon className="h-4 w-4" />
                          ) : (
                            <span className="text-sm">{t(item.title)}</span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                      
                      {!collapsed && item.addUrl && (
                        <Link 
                          to={item.addUrl}
                          title={\`New \${item.title.replace(/s$/, "")}\`}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-1.5 hover:bg-slate-700 rounded-md transition-all text-slate-400 hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </SidebarMenuItem>
                  ))}

                  {isOpen && g.subGroups?.map((sub) => {
                    const isSubOpen = openGroups[sub.key] !== undefined ? openGroups[sub.key] : sub.items.some(item => isActive(item.url) || (item.addUrl && isActive(item.addUrl)));
                    return (
                      <div key={sub.key} className="mt-1">
                        <SidebarMenuItem className={\`group/item \${collapsed ? "pl-0 flex justify-center" : "pl-4"}\`}>
                          <SidebarMenuButton 
                            onClick={() => setOpenGroups(prev => ({ ...prev, [sub.key]: !isSubOpen }))} 
                            className="hover:bg-transparent h-9 text-slate-400 hover:text-white cursor-pointer"
                            tooltip={collapsed ? t(sub.label) : undefined}
                          >
                            {collapsed ? (
                               <>
                                  {sub.key === "sales" && <FileText className="h-4 w-4" />}
                                  {sub.key === "catalog" && <Package className="h-4 w-4" />}
                                  {sub.key === "purchases" && <ShoppingCart className="h-4 w-4" />}
                                  {sub.key === "accounting" && <Calculator className="h-4 w-4" />}
                               </>
                            ) : (
                               <>
                                 <span className="flex-1 text-sm">{t(sub.label)}</span>
                                 <ChevronRight className={\`h-3.5 w-3.5 transition-transform \${isSubOpen ? "rotate-90" : ""}\`} />
                               </>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {isSubOpen && !collapsed && (
                          <div className="pl-6 border-l border-slate-700/50 ml-6 mt-1 space-y-1">
                            {sub.items.map(item => (
                              <SidebarMenuItem key={item.title} className="group/subitem">
                                <SidebarMenuButton asChild isActive={isActive(item.url)}>
                                  <Link to={item.url} className="h-8 hover:bg-[#1e293b] hover:text-white transition-colors rounded-lg">
                                    <span className="text-sm">{t(item.title)}</span>
                                  </Link>
                                </SidebarMenuButton>
                                {item.addUrl && (
                                  <Link 
                                    to={item.addUrl}
                                    title={\`New \${item.title.replace(/s$/, "")}\`}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/subitem:opacity-100 p-1 hover:bg-slate-700 rounded-md transition-all text-slate-400 hover:text-white"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Link>
                                )}
                              </SidebarMenuItem>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}`;

content = content.replace(/{sidebarGroups\.map\(\(g\) => \{[\s\S]*?\}\)}\n\s*\{\/\* Settings group/, renderLogic + "\n\n        {/* Settings group");

fs.writeFileSync("src/components/layout/AppSidebar.tsx", content);
console.log("Success");

