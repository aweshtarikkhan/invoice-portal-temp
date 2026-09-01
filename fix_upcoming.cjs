const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// Add isUpcoming to featureGroups mapping
code = code.replace(/label: g\.label,\n\s*isLocked:/, 'label: g.label,\n          isUpcoming: g.isUpcoming,\n          isLocked:');

// Replace the Lock logic to use Clock for upcoming
code = code.replace(/\{g\.isUpcoming && \(\n\s*<span className="text-\[9px\][^>]+>[\s\S]*?<\/span>\n\s*\)\}/, 
`{g.isUpcoming && (
                              <div className="flex items-center gap-1.5 shrink-0 ml-2" title="Coming Soon">
                                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap hidden group-hover/groupbtn:block">
                                  Coming Soon
                                </span>
                              </div>
                            )}`);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log('Fixed upcoming UI');
