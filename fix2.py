import re
with open('src/pages/AttendancePage.tsx', 'r', encoding='utf-8') as f: code = f.read()
code = code.replace(
    'map[${r.employee_id}|] = r.status;',
    'map[${r.employee_id}|] = r.override_status || r.status;'
)
with open('src/pages/AttendancePage.tsx', 'w', encoding='utf-8') as f: f.write(code)
