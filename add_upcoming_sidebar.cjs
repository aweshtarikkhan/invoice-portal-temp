const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Replace the NavLink block for g.items.map
const oldBlock = `<NavLink
                            to={item.url}
                            className={\`hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg \${(g as any).isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}\`} title={(g as any).isLocked ? "Upgrade to use this feature" : undefined} onClick={(e) => { if((g as any).isLocked) e.preventDefault(); }}
                          >
                            {collapsed ? (
                              <item.icon className="h-4 w-4" />
                            ) : (
                              <span className="text-sm">{t(item.title)}</span>
                            )}
                          </NavLink>`;

const newBlock = `<NavLink
                            to={item.url}
                            className={\`hover:bg-[#1e293b] hover:text-white transition-colors h-9 rounded-lg \${(g as any).isLocked ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} \${(item as any).isUpcoming ? "opacity-60 cursor-default" : ""}\`} 
                            title={(g as any).isLocked ? "Upgrade to use this feature" : ((item as any).isUpcoming ? "Coming Soon" : undefined)} 
                            onClick={(e) => { if((g as any).isLocked || (item as any).isUpcoming) e.preventDefault(); }}
                          >
                            {collapsed ? (
                              <item.icon className="h-4 w-4" />
                            ) : (
                              <div className="flex items-center justify-between w-full pr-2">
                                <span className="text-sm">{t(item.title)}</span>
                                {(item as any).isUpcoming && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap hidden group-hover/item:block">
                                    Coming Soon
                                  </span>
                                )}
                              </div>
                            )}
                          </NavLink>`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log("Updated AppSidebar.tsx");
