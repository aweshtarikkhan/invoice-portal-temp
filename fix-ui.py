import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    # 1. Fix rounding
    content = content.replace(
        '__rate = __rate / (1 + Number(__tax.rate) / 100);',
        '__rate = Number((__rate / (1 + Number(__tax.rate) / 100)).toFixed(2));'
    )
    
    # 2. Fix expiry_warning position
    warning_regex = r'(\s*)</div>\s*(\{line\.expiry_warning && <div className="text-xs text-red-500 font-medium mt-1">\{line\.expiry_warning\}</div>\})'
    
    # We replace it with: \n\1  {line.expiry_warning && <div className="text-[10px] text-red-500 font-medium mt-1">{line.expiry_warning}</div>}\n\1</div>
    # But wait, it's safer to just do a simple string replace.
    old_str = """        </div>
        {line.expiry_warning && <div className="text-xs text-red-500 font-medium mt-1">{line.expiry_warning}</div>}"""
    
    new_str = """          {line.expiry_warning && <div className="text-[10px] text-red-500 font-medium mt-1">{line.expiry_warning}</div>}
        </div>"""
    
    content = content.replace(old_str, new_str)
    
    # Just in case it has different indentation
    old_str_2 = """          </div>
          {line.expiry_warning && <div className="text-xs text-red-500 font-medium mt-1">{line.expiry_warning}</div>}"""
    new_str_2 = """            {line.expiry_warning && <div className="text-[10px] text-red-500 font-medium mt-1">{line.expiry_warning}</div>}
          </div>"""
    content = content.replace(old_str_2, new_str_2)
    
    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
