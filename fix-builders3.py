import os

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    changed = False
    
    # query replace
    q1 = 'custom_field_values(field_value, custom_field_definitions(field_name))'
    q2 = 'custom_field_values(value, custom_field_definitions(field_name))'
    if q1 in content:
        content = content.replace(q1, q2)
        changed = True

    # logic replace
    q3 = 'cf.field_value'
    q4 = 'cf.value'
    if q3 in content:
        content = content.replace(q3, q4)
        changed = True
        
    if changed:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
