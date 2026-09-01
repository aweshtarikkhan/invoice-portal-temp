with open('src/pages/LeavesPage.tsx', 'r', encoding='utf-8') as f: code = f.read()
code = code.replace('Casual=12, Sick=5, Paid=8 per year.', 'Casual=12, Sick=5, EL/PL=15 per year.')
with open('src/pages/LeavesPage.tsx', 'w', encoding='utf-8') as f: f.write(code)
