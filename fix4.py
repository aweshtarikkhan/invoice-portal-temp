import re

with open('src/pages/AttendancePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace(
    'title={Approved  leave}',
    'title={Approved  leave}'
)
code = code.replace(
    'autoAttKeys.has(|)',
    'autoAttKeys.has(${emp.id}|)'
)

with open('src/pages/AttendancePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
