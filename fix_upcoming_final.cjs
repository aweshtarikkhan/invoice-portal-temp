const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// 1. Map isUpcoming
const oldMap = `      return {
        key: g.key,
        label: g.label,
        isLocked: !isGroupEnabled(g.key) || !platformFeatures.includes(g.key),`;
const newMap = `      return {
        key: g.key,
        label: g.label,
        isUpcoming: g.isUpcoming,
        isLocked: !isGroupEnabled(g.key) || !platformFeatures.includes(g.key),`;

code = code.replace(oldMap, newMap);

// 2. Fix the Lock icon logic. It was:
// {(g as any).isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" title="Upgrade to use this feature" />}

const oldLabelDiv = `<span className="flex-1 font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm ml-2 flex items-center justify-between pr-2">
                            {t(g.label)}
                            {(g as any).isLocked && <Lock className="h-3.5 w-3.5 text-amber-500" title="Upgrade to use this feature" />}
                          </span>`;

const newLabelDiv = `<div className="flex-1 flex items-center justify-between pr-2 ml-2 min-w-0">
                            <span className="font-medium text-slate-300 group-hover/groupbtn:text-white tracking-wide text-sm truncate">
                              {t(g.label)}
                            </span>
                            {(g as any).isLocked && !(g as any).isUpcoming && <Lock className="h-3.5 w-3.5 text-amber-500 ml-2 shrink-0" title="Upgrade to use this feature" />}
                            {(g as any).isUpcoming && (
                              <div className="flex items-center gap-1.5 shrink-0 ml-2" title="Coming Soon">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap hidden group-hover/groupbtn:block">
                                  Coming Soon
                                </span>
                              </div>
                            )}
                          </div>`;

code = code.replace(oldLabelDiv, newLabelDiv);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log('Fixed properly');
