import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    changed = False

    # 1. Update interface LineItem
    interface_match = re.search(r'interface LineItem \{.*?\n\}', content, re.DOTALL)
    if interface_match:
        old_interface = interface_match.group(0)
        new_interface = old_interface.replace('quantity: number;', 'quantity: any;')
        new_interface = new_interface.replace('rate: number;', 'rate: any;')
        new_interface = new_interface.replace('discount: number;', 'discount: any;')
        if old_interface != new_interface:
            content = content.replace(old_interface, new_interface)
            changed = True
            
    # 2. Update createEmptyLine
    empty_line_match = re.search(r'function createEmptyLine(?:<[^>]+>)?\(\).*?return \{.*?\};?\s*\}', content, re.DOTALL)
    if empty_line_match:
        old_empty = empty_line_match.group(0)
        new_empty = old_empty.replace('quantity: 1,', 'quantity: "",')
        new_empty = new_empty.replace('quantity: 0,', 'quantity: "",') # just in case
        new_empty = new_empty.replace('rate: 0,', 'rate: "",')
        new_empty = new_empty.replace('discount: 0,', 'discount: "",')
        if old_empty != new_empty:
            content = content.replace(old_empty, new_empty)
            changed = True

    # 3. Update Inputs (Quantity)
    # <Input type="number" className="h-8 text-xs text-center font-medium" value={line.quantity} onChange={(e) => onChange(index, "quantity", parseFloat(e.target.value) || 0)} min={0} step="0.01" />
    # We will use regex to find all Inputs for quantity, rate, discount
    
    # Quantity
    q_pattern = r'<Input[^>]*value=\{line\.quantity\}[^>]*onChange=\{\(e\) => onChange\(index, "quantity", parseFloat\(e\.target\.value\) \|\| 0\)\}[^>]*>'
    def q_repl(match):
        m = match.group(0)
        m = m.replace('parseFloat(e.target.value) || 0', 'e.target.value === "" ? "" : (parseFloat(e.target.value) || 0)')
        if 'placeholder=' not in m:
            m = m.replace('<Input', '<Input placeholder="1"')
        return m
    
    content, num_q = re.subn(q_pattern, q_repl, content)
    if num_q > 0: changed = True

    # Rate
    r_pattern = r'<Input[^>]*value=\{line\.rate\}[^>]*onChange=\{\(e\) => onChange\(index, "rate", parseFloat\(e\.target\.value\) \|\| 0\)\}[^>]*>'
    def r_repl(match):
        m = match.group(0)
        m = m.replace('parseFloat(e.target.value) || 0', 'e.target.value === "" ? "" : (parseFloat(e.target.value) || 0)')
        if 'placeholder=' not in m:
            m = m.replace('<Input', '<Input placeholder="0"')
        return m
    
    content, num_r = re.subn(r_pattern, r_repl, content)
    if num_r > 0: changed = True

    # Discount
    d_pattern = r'<Input[^>]*value=\{line\.discount\}[^>]*onChange=\{\(e\) => onChange\(index, "discount", parseFloat\(e\.target\.value\) \|\| 0\)\}[^>]*>'
    def d_repl(match):
        m = match.group(0)
        m = m.replace('parseFloat(e.target.value) || 0', 'e.target.value === "" ? "" : (parseFloat(e.target.value) || 0)')
        if 'placeholder=' not in m:
            m = m.replace('<Input', '<Input placeholder="0"')
        return m
    
    content, num_d = re.subn(d_pattern, d_repl, content)
    if num_d > 0: changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
