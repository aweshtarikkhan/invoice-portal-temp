import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    # 1. Add expiry_warning to LineItem interface
    if 'expiry_warning?: string;' not in content:
        content = re.sub(r'(interface Line(?:Item)? \{.*?)\}', r'\1  expiry_warning?: string;\n}', content, flags=re.DOTALL)
        
    # 2. Update createEmptyLine to have quantity: 1 instead of ""
    content = re.sub(r'quantity:\s*"",', 'quantity: 1,', content)
    content = re.sub(r'quantity:\s*0,', 'quantity: 1,', content)
    
    # 3. Add onFocus and onBlur to quantity Input
    q_input_pattern = r'<Input([^>]*)value=\{line\.quantity\}([^>]*)onChange=\{\(e\)\s*=>\s*onChange\(index,\s*"quantity",\s*e\.target\.value\s*===\s*""\s*\?\s*""\s*:\s*\(parseFloat\(e\.target\.value\)\s*\|\|\s*0\)\)\}([^>]*)>'
    
    def q_repl(m):
        attrs1 = m.group(1)
        attrs2 = m.group(2)
        attrs3 = m.group(3)
        if 'onFocus' not in attrs1 and 'onFocus' not in attrs2 and 'onFocus' not in attrs3:
            return f'<Input{attrs1}onFocus={{(e) => e.target.select()}} onBlur={{(e) => {{ if (!e.target.value || parseFloat(e.target.value) <= 0) onChange(index, "quantity", 1); }}}} value={{line.quantity}}{attrs2}onChange={{(e) => onChange(index, "quantity", e.target.value === "" ? "" : (parseFloat(e.target.value) || 0))}}{attrs3}>'
        return m.group(0)
    
    content = re.sub(q_input_pattern, q_repl, content)

    # 4. Handle item expiry in handleItemSelect (for Bill, Estimate, Invoice)
    # We will look for: const handleItemSelect = async (item: any) => { ... }
    # Or const handleItemSelect = (item: any) => { ... }
    # And inject the expiry check right before setItemDropdownOpen(false); or at the end.
    
    if 'const handleItemSelect = async (item: any) => {' in content or 'const handleItemSelect = (item: any) => {' in content:
        # Check if we already injected it
        if 'expiry_warning' not in content[content.find('handleItemSelect'):]:
            # Simple injection before setItemDropdownOpen or at end of handleItemSelect block
            # Actually, easiest is to just use regex to replace `onChange(index, "name", item.name);`
            # with the expiry logic as well.
            
            expiry_logic = """onChange(index, "name", item.name);
    if (item.has_expiry && item.expiry_date) {
      const exp = new Date(item.expiry_date);
      const now = new Date();
      const days = (exp.getTime() - now.getTime()) / (1000 * 3600 * 24);
      const { format } = await import("date-fns");
      if (days < 0) {
        onChange(index, "expiry_warning", `Expired on ${format(exp, 'MMM d, yyyy')}`);
      } else if (days < 30) {
        onChange(index, "expiry_warning", `Expiring on ${format(exp, 'MMM d, yyyy')}`);
      } else {
        onChange(index, "expiry_warning", "");
      }
    } else {
      onChange(index, "expiry_warning", "");
    }"""
            content = content.replace('onChange(index, "name", item.name);', expiry_logic)
            
            # Now we must render expiry_warning in the UI!
            # Find where we render the description Input or item select, and append the warning div.
            # In InvoiceBuilderPage/BillBuilderPage, it's usually inside <div className="col-span-4..."> or <div className="col-span-5...">
            # We can just look for `{/* Quantity */}` and inject the warning right BEFORE it, inside the description's <div>.
            
            warning_div = '{line.expiry_warning && <div className="text-xs text-red-500 font-medium mt-1">{line.expiry_warning}</div>}'
            
            if warning_div not in content:
                content = content.replace('{/* Quantity */}', f'{warning_div}\n        {{/* Quantity */}}')


    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
