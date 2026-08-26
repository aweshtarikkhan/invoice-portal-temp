const fs = require('fs');
const path = 'src/components/layout/AppSidebar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace {isOpen && g.items.map((item) => (
const search1 = `{isOpen && g.items.map((item) => (`
const replace1 = `<div className={\`grid transition-all duration-300 ease-in-out \${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}\`}>
                    <div className="overflow-hidden">
                  {g.items.map((item) => (`
content = content.replace(search1, replace1);

// Close the div after the items map
const search2 = `                      )}
                    </SidebarMenuItem>
                  ))}

                  {isOpen && g.subGroups?.map((sub) => {`;
const replace2 = `                      )}
                    </SidebarMenuItem>
                  ))}
                  </div>
                  </div>

                  <div className={\`grid transition-all duration-300 ease-in-out \${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}\`}>
                    <div className="overflow-hidden">
                  {g.subGroups?.map((sub) => {`;
content = content.replace(search2, replace2);

// Close the subGroups map div
const search3 = `                          </div>
                        )}
                      </div>
                    );
                  })}
                </SidebarMenu>`;
const replace3 = `                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  </div>
                </SidebarMenu>`;
content = content.replace(search3, replace3);

// Replace sub.items animation
const search4 = `{isSubOpen && !collapsed && (
                          <div className="pl-6 border-l border-slate-700/50 ml-6 mt-1 space-y-1">
                            {sub.items.map(item => (`
const replace4 = `<div className={\`grid transition-all duration-300 ease-in-out \${isSubOpen && !collapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}\`}>
                          <div className="overflow-hidden pl-6 border-l border-slate-700/50 ml-6 mt-1 space-y-1">
                            {sub.items.map(item => (`
content = content.replace(search4, replace4);

// Close sub.items animation
const search5 = `                              </SidebarMenuItem>
                            ))}
                          </div>
                        )}`;
const replace5 = `                              </SidebarMenuItem>
                            ))}
                          </div>
                        </div>`;
content = content.replace(search5, replace5);

// Settings items animation
const search6 = `{(settingsOpen || isSettingsActive) && (
                    <>
                      {settingsItems.map((item) => (`;
const replace6 = `<div className={\`grid transition-all duration-300 ease-in-out \${(settingsOpen || isSettingsActive) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}\`}>
                    <div className="overflow-hidden">
                      {settingsItems.map((item) => (`;
content = content.replace(search6, replace6);

const search7 = `                        </SidebarMenuItem>
                      )}
                    </>
                  )}`;
const replace7 = `                        </SidebarMenuItem>
                      )}
                    </div>
                  </div>`;
content = content.replace(search7, replace7);


// Scroll into view logic - delay it slightly more to let the CSS animation finish or progress
content = content.replace(
  /setTimeout\(\(\) => \{\s*const el = document\.getElementById\(\`group-\$\{key\}\`\);\s*if \(el\) \{\s*el\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\);\s*\}\s*\}, 150\);/g,
  `setTimeout(() => {
        const el = document.getElementById(\`group-\${key}\`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);`
);

content = content.replace(
  /setTimeout\(\(\) => \{\s*document\.getElementById\("group-settings"\)\?\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\);\s*\}, 150\);/g,
  `setTimeout(() => {
                              document.getElementById("group-settings")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 300);`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Animation patched!");
