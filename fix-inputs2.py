import os

def fix_file(filename, q_replace, r_replace):
    path = os.path.join(os.getcwd(), 'src', 'pages', filename)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    # fix empty line
    content = content.replace('quantity: "1"', 'quantity: ""').replace('quantity: "0"', 'quantity: ""')
    content = content.replace('rate: "0"', 'rate: ""').replace('rate: "1"', 'rate: ""')
    content = content.replace('unit_cost: "0"', 'unit_cost: ""')
    content = content.replace('discount: "0"', 'discount: ""')

    # fix inputs
    if q_replace and q_replace[0]:
        content = content.replace(q_replace[0], q_replace[1])
    if r_replace and r_replace[0]:
        content = content.replace(r_replace[0], r_replace[1])

    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {filename}")

fix_file(
    'PurchaseOrderBuilderPage.tsx',
    ('<Input type="number"', '<Input type="number" placeholder="1"'),
    (None, None)
)

fix_file(
    'GrnBuilderPage.tsx',
    ('<Input type="number"', '<Input type="number" placeholder="1"'),
    (None, None)
)

fix_file(
    'DeliveryChallanBuilderPage.tsx',
    ('<Input type="number"', '<Input type="number" placeholder="1"'),
    (None, None)
)
