import os
import re

base_dir = os.path.join(os.getcwd(), 'src', 'pages')
files = [f for f in os.listdir(base_dir) if f.endswith('BuilderPage.tsx')]

for f in files:
    path = os.path.join(base_dir, f)
    with open(path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    old_content = content
    
    # 1. Update EstimateBuilderPage.tsx to have async handleItemSelect
    if f == 'EstimateBuilderPage.tsx':
        content = content.replace('const handleItemSelect = (itemId: string) => {', 'const handleItemSelect = async (itemId: string) => {')

    # 2. Add reverse tax calculation
    
    # Find all occurrences of setting rate in handleItemSelect or handleItemChange
    # Typically: onChange(index, "rate", Number(item.unit_price) || 0);
    # Or in PO: rate: String(it.unit_price || 0)
    
    # In Invoice, Bill, Estimate, Credit Note, DC:
    pattern_rate_set = r'(onChange\(index,\s*"rate",\s*)(Number\(item\.unit_price\)\s*\|\|\s*0)(\);)'
    
    replacement_logic = """    let __rate = Number(item.unit_price) || 0;
    const __priceType = window.location.pathname.includes("bill") || window.location.pathname.includes("purchase") || window.location.pathname.includes("grn") ? (item.purchase_price_type || "without_tax") : (item.sales_price_type || "without_tax");
    if (__priceType === "with_tax" && item.tax_id) {
      const __tax = taxRates.find((t: any) => t.id === item.tax_id);
      if (__tax && Number(__tax.rate) > 0) {
        __rate = __rate / (1 + Number(__tax.rate) / 100);
      }
    }
    onChange(index, "rate", __rate);"""
    
    if re.search(pattern_rate_set, content):
        content = re.sub(pattern_rate_set, replacement_logic, content)
        
    # In PurchaseOrder and GRN, they don't use SortableLineItem.
    # In PO Builder: rate: String(it.unit_price || 0)
    # We should intercept the selected item in handleItemChange.
    if f == 'PurchaseOrderBuilderPage.tsx':
        # we will replace `x[idx].rate = String(it.unit_price || 0);`
        # and `tax_rate: it.tax_id ? String(taxRates.find((t: any) => t.id === it.tax_id)?.rate || 0) : "0";`
        
        po_logic = """      let __rate = Number(it.unit_price) || 0;
      const __priceType = it.purchase_price_type || "without_tax";
      if (__priceType === "with_tax" && it.tax_id) {
        const __tax = taxRates.find((t: any) => t.id === it.tax_id);
        if (__tax && Number(__tax.rate) > 0) {
          __rate = __rate / (1 + Number(__tax.rate) / 100);
        }
      }
      x[idx].rate = String(__rate);"""
        content = re.sub(r'x\[idx\]\.rate\s*=\s*String\(it\.unit_price\s*\|\|\s*0\);', po_logic, content)

    if f == 'GrnBuilderPage.tsx':
        grn_logic = """      let __rate = Number(it.purchase_price) || 0;
      const __priceType = it.purchase_price_type || "without_tax";
      if (__priceType === "with_tax" && it.tax_id) {
        const __tax = taxRates.find((t: any) => t.id === it.tax_id);
        if (__tax && Number(__tax.rate) > 0) {
          __rate = __rate / (1 + Number(__tax.rate) / 100);
        }
      }
      x[idx].unit_cost = String(__rate);"""
        content = re.sub(r'x\[idx\]\.unit_cost\s*=\s*String\(it\.purchase_price\s*\|\|\s*0\);', grn_logic, content)

    if content != old_content:
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
