import re

with open('src/pages/AttendancePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

pattern = r'<button[^>]*onClick=\{\(\) => \{[^}]*if \(isHoliday \|\| isOff\) return; // don\'t cycle holidays/weekoffs[^}]*cycle\(emp\.id, ds\);[^}]*\}\}[^>]*>[\s\S]*?</button>'

replacement = '''{isHoliday || isOff ? (
                            <span className="inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] font-semibold bg-muted text-muted-foreground border-border" title={ds}>HO</span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button title={ds}>
                                  {isAL ? (
                                    <span className="inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] font-semibold bg-purple-100 text-purple-700 border-purple-300" title={Approved  leave}>AL</span>
                                  ) : displayStatus ? (
                                    statusBadge(displayStatus as Status, autoAttKeys.has(${emp.id}|))
                                  ) : (
                                    <span className="inline-flex items-center justify-center h-6 w-7 rounded border text-[10px] text-muted-foreground border-dashed">-</span>
                                  )}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                                {STATUS_OPTIONS.map(opt => (
                                  <DropdownMenuItem 
                                    key={opt.value} 
                                    onClick={() => setCell(emp.id, ds, opt.value)}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    <span className={inline-flex items-center justify-center h-5 w-6 rounded border text-[9px] font-semibold }>
                                      {opt.short}
                                    </span>
                                    {opt.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}'''

new_code = re.sub(pattern, replacement, code)
if code == new_code:
    print("Failed to replace")
else:
    with open('src/pages/AttendancePage.tsx', 'w', encoding='utf-8') as f:
        f.write(new_code)
    print("Replaced successfully")
