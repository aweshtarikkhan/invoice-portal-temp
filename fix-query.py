import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    content = content.replace('supabase.from("items").select("*, custom_field_values(value, custom_field_definitions(field_name))")', 'supabase.from("items").select("*")')
    
    # We also need to fetch custom fields. Let's do that for InvoiceBuilderPage separately using multi_replace_file_content if needed,
    # or let's try to inject the fetch logic here. 
    # But since variable names differ (c, i, t vs v, i, t), it's easier to just fetch it inside handleItemSelect?
    # No, handleItemSelect is synchronous in most places unless we change it.
    
    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
