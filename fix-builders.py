import os

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

old_desc = 'line.description = item.description || "";'
new_desc = '''
                    let extraDesc = "";
                    if (item.custom_field_values && item.custom_field_values.length > 0) {
                      extraDesc = item.custom_field_values
                        .filter((cf: any) => cf.field_value)
                        .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.field_value}`)
                        .join("\\n");
                    }
                    line.description = item.description ? (extraDesc ? `${item.description}\\n${extraDesc}` : item.description) : extraDesc;
'''.strip()

old_onchange = 'onChange(index, "description", item.description || "");'
new_onchange = '''
    let extraDesc = "";
    if (item.custom_field_values && item.custom_field_values.length > 0) {
      extraDesc = item.custom_field_values
        .filter((cf: any) => cf.field_value)
        .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.field_value}`)
        .join("\\n");
    }
    onChange(index, "description", item.description ? (extraDesc ? `${item.description}\\n${extraDesc}` : item.description) : extraDesc);
'''.strip()

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    changed = False
    
    # query replace
    q1 = 'supabase.from("items").select("*")'
    q2 = 'supabase.from("items").select("*, custom_field_values(field_value, custom_field_definitions(field_name))")'
    if q1 in content:
        content = content.replace(q1, q2)
        changed = True

    q3 = 'supabase.from("items").select("*, tax_rates(name, rate)")'
    q4 = 'supabase.from("items").select("*, tax_rates(name, rate), custom_field_values(field_value, custom_field_definitions(field_name))")'
    if q3 in content:
        content = content.replace(q3, q4)
        changed = True
        
    if old_desc in content:
        content = content.replace(old_desc, new_desc)
        changed = True
        
    if old_onchange in content:
        content = content.replace(old_onchange, new_onchange)
        changed = True
        
    if changed:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
