const fs = require('fs');

const files = [
  'src/pages/BillBuilderPage.tsx',
  'src/pages/PurchaseOrderBuilderPage.tsx',
  'src/pages/EstimateBuilderPage.tsx',
  'src/pages/CreditNoteBuilderPage.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. LineItem type
  if (!content.includes('sub_unit?: string;')) {
    content = content.replace(/hsn_code:\s*string;/, 'hsn_code: string;\n  sub_unit?: string;\n  sub_unit_conversion_rate?: number;');
  }

  // 2. createEmptyLine
  if (!content.includes('sub_unit: "",')) {
    content = content.replace(/hsn_code:\s*"",?\n\s*};/, 'hsn_code: "",\n    sub_unit: "",\n    sub_unit_conversion_rate: 1,\n  };');
  }

  // 3. SortableLineItem props
  if (!content.includes('org: any;')) {
    content = content.replace(/currency:\s*string;\n}\)/, 'currency: string;\n  org: any;\n})');
    content = content.replace(/currency,\n}: \{/, 'currency,\n  org,\n}: {');
  }

  // 4. handleItemSelect
  if (!content.includes('sub_unit_conversion_rate", item.sub_unit_conversion_rate')) {
    content = content.replace(/onChange\(index, "tax_id", item\.tax_id \|\| null\);/, 'onChange(index, "tax_id", item.tax_id || null);\n    onChange(index, "sub_unit", item.sub_unit || "");\n    onChange(index, "sub_unit_conversion_rate", item.sub_unit_conversion_rate || 1);');
  }

  // 5. UI display
  if (!content.includes('org?.sub_unit_enabled')) {
    const uiRegex = /\{line\.item_id \? \(\s*line\.unit && <span className="text-\[10px\] text-muted-foreground text-center block mt-0\.5">\{line\.unit\}<\/span>\s*\) : \(/;
    const replacement = `{line.item_id ? (
            <div className="flex flex-col items-center mt-0.5">
              {line.unit && <span className="text-[10px] text-muted-foreground">{line.unit}</span>}
              {org?.sub_unit_enabled && line.sub_unit && (
                <span className="text-[10px] text-muted-foreground/60">
                  = {(line.quantity * (line.sub_unit_conversion_rate || 1)).toLocaleString("en-IN", { maximumFractionDigits: 2 })} {line.sub_unit}
                </span>
              )}
            </div>
          ) : (`.trim();
    content = content.replace(uiRegex, replacement);
  }

  // 6. Saving mapped items (2 places: update existing mapping, new lines mapping)
  if (!content.includes('sub_unit: l.sub_unit')) {
    content = content.replace(/hsn_code:\s*l\.hsn_code\?\.trim\(\) \|\| null,?/, 'hsn_code: l.hsn_code?.trim() || null,\n          sub_unit: l.sub_unit,\n          sub_unit_conversion_rate: l.sub_unit_conversion_rate');
  }
  
  if (!content.includes('sub_unit: (l as any).sub_unit')) {
    content = content.replace(/hsn_code:\s*\(l as any\)\.hsn_code \|\| "",?/, 'hsn_code: (l as any).hsn_code || "",\n          sub_unit: (l as any).sub_unit || "",\n          sub_unit_conversion_rate: Number((l as any).sub_unit_conversion_rate) || 1,');
  }

  // Also estimate detail loads:
  if (!content.includes('sub_unit_conversion_rate: Number(l.sub_unit_conversion_rate)')) {
    content = content.replace(/hsn_code:\s*l\.hsn_code \|\| "",?/, 'hsn_code: l.hsn_code || "",\n        sub_unit: l.sub_unit || "",\n        sub_unit_conversion_rate: Number(l.sub_unit_conversion_rate) || 1,');
  }

  // 7. SortableLineItem call
  if (!content.includes('org={org}')) {
    content = content.replace(/currency=\{org\?\.currency_code \|\| "INR"\}/g, 'currency={org?.currency_code || "INR"}\n                  org={org}');
  }

  fs.writeFileSync(file, content);
}

console.log("Done");
