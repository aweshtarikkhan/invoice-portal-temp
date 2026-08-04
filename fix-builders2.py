import os

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = ['PurchaseOrderBuilderPage.tsx', 'GrnBuilderPage.tsx', 'DeliveryChallanBuilderPage.tsx']

for f in files:
    path = os.path.join(base_dir, f)
    if not os.path.exists(path): continue
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    changed = False
    
    # query replace
    q1 = '(supabase as any).from("items").select("*")'
    q2 = '(supabase as any).from("items").select("*, custom_field_values(field_value, custom_field_definitions(field_name))")'
    if q1 in content:
        content = content.replace(q1, q2)
        changed = True

    q3 = 'supabase.from("items").select("id, name, unit, sku, hsn_code, track_batches, track_serials")'
    q4 = 'supabase.from("items").select("id, name, unit, sku, hsn_code, track_batches, track_serials, custom_field_values(field_value, custom_field_definitions(field_name))")'
    if q3 in content:
        content = content.replace(q3, q4)
        changed = True
        
    old_desc1 = 'x[idx].description = it.name;'
    new_desc1 = '''
      let extraDesc = "";
      if (it.custom_field_values && it.custom_field_values.length > 0) {
        extraDesc = it.custom_field_values
          .filter((cf: any) => cf.field_value)
          .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.field_value}`)
          .join("\\n");
      }
      x[idx].description = it.name + (extraDesc ? `\\n${extraDesc}` : "");
'''.strip()

    if old_desc1 in content:
        content = content.replace(old_desc1, new_desc1)
        changed = True
        
    old_desc2 = 'n[i].description = it.name;'
    new_desc2 = '''
    let extraDesc = "";
    if (it.custom_field_values && it.custom_field_values.length > 0) {
      extraDesc = it.custom_field_values
        .filter((cf: any) => cf.field_value)
        .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.field_value}`)
        .join("\\n");
    }
    n[i].description = it.name + (extraDesc ? `\\n${extraDesc}` : "");
'''.strip()

    if old_desc2 in content:
        content = content.replace(old_desc2, new_desc2)
        changed = True
        
    if changed:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
