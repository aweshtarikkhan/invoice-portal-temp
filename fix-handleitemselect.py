import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    # We want to replace:
    # const handleItemSelect = (item: any) => {
    #   ...
    #   let extraDesc = "";
    #   if (item.custom_field_values && item.custom_field_values.length > 0) {
    #     extraDesc = item.custom_field_values
    #       .filter((cf: any) => cf.value)
    #       .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.value}`)
    #       .join("\n");
    #   }
    
    # We will replace `const handleItemSelect = (item: any) => {` with `const handleItemSelect = async (item: any) => {`
    
    # First, make it async
    content = content.replace('const handleItemSelect = (item: any) => {', 'const handleItemSelect = async (item: any) => {')
    
    # Now replace the if block with the fetch block
    target_block = """    if (item.custom_field_values && item.custom_field_values.length > 0) {
      extraDesc = item.custom_field_values
        .filter((cf: any) => cf.value)
        .map((cf: any) => `${cf.custom_field_definitions?.field_name}: ${cf.value}`)
        .join("\\n");
    }"""
    
    replacement = """    const { data: cfs } = await supabase
      .from("custom_field_values")
      .select("value, custom_field_definitions(field_name)")
      .eq("entity_id", item.id);
      
    if (cfs && cfs.length > 0) {
      extraDesc = cfs
        .filter((cf: any) => cf.value)
        .map((cf: any) => `${(cf.custom_field_definitions as any)?.field_name}: ${cf.value}`)
        .join("\\n");
    }"""
    
    # In some files it might use supabase, in others (supabase as any)
    # Actually, supabase is generally available in Builder pages.
    # Let's replace.
    if target_block in content:
        content = content.replace(target_block, replacement)
    else:
        # try regex for more flexibility
        regex = r'if\s*\(item\.custom_field_values\s*&&\s*item\.custom_field_values\.length\s*>\s*0\)\s*\{.*?\}'
        content = re.sub(regex, replacement, content, flags=re.DOTALL)
        
    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
