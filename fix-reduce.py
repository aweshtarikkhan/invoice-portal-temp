import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    # fix s + l.quantity
    content = re.sub(r's \+ l\.quantity', r's + (Number(l.quantity) || 0)', content)
    
    # fix s + (l.quantity * l.rate)
    content = re.sub(r'l\.quantity \* l\.rate', r'(Number(l.quantity) || 0) * (Number(l.rate) || 0)', content)

    # for PO Builder and others: s + Number(l.quantity)
    # just in case it already exists, let's be careful. The regex above will replace it correctly if it was exactly s + l.quantity
    
    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
