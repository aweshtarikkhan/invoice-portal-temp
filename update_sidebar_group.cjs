const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

const newIcons = `{g.key === "outreach" && <MessageCircle className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                        {g.key === "feedback" && <MessageSquareQuote className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}
                        {g.key === "ai-analysis" && <BrainCircuit className="h-5 w-5 opacity-70 group-hover/groupbtn:opacity-100" />}`;

code = code.replace(/\{g\.key === "outreach" && <MessageCircle[^>]+>\s*\}/, newIcons);

const oldLabel = `<span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2 flex items-center justify-between pr-2">
                            {t(g.label)}
                            {(g as any).isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" title="Upgrade to use this feature" />}
                          </span>`;
                          
const newLabel = `<div className="flex-1 flex items-center justify-between pr-2 ml-2 min-w-0">
                            <span className="font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm truncate">
                              {t(g.label)}
                            </span>
                            {(g as any).isLocked && !g.isUpcoming && <Lock className="h-3.5 w-3.5 text-amber-500 ml-2 shrink-0" title="Upgrade to use this feature" />}
                            {g.isUpcoming && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap hidden group-hover/groupbtn:block shrink-0 ml-2">
                                Coming Soon
                              </span>
                            )}
                          </div>`;

code = code.replace(oldLabel, newLabel);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log("Updated AppSidebar group labels");
