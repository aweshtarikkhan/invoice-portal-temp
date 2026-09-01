import re

with open('src/pages/LeavesPage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('["casual", "sick", "paid"]', '["casual", "sick", "el_pl"]')
code = code.replace('Paid (Used / Annual)', 'Earned/PL (Used / Annual)')

with open('src/pages/LeavesPage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
