const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('BuilderPage.tsx'));

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Update the items fetch query
  if (content.includes('supabase.from("items").select("*")')) {
    content = content.replace(
      'supabase.from("items").select("*")',
      'supabase.from("items").select("*, custom_field_values(field_value, custom_field_definitions(field_name))")'
    );
    changed = true;
  }

  // 2. Update the handleAddItem description logic
  const oldDescLogic = 'line.description = item.description || "";';
  const newDescLogic = `
                    let extraDesc = "";
                    if (item.custom_field_values && item.custom_field_values.length > 0) {
                      extraDesc = item.custom_field_values
                        .filter((cf: any) => cf.field_value)
                        .map((cf: any) => \`\${cf.custom_field_definitions?.field_name}: \${cf.field_value}\`)
                        .join("\\n");
                    }
                    line.description = item.description ? (extraDesc ? \`\${item.description}\\n\${extraDesc}\` : item.description) : extraDesc;
  `.trim();

  if (content.includes(oldDescLogic)) {
    content = content.replace(new RegExp(oldDescLogic.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newDescLogic);
    changed = true;
  }

  const oldOnChangeDesc = 'onChange(index, "description", item.description || "");';
  const newOnChangeDesc = `
    let extraDesc = "";
    if (item.custom_field_values && item.custom_field_values.length > 0) {
      extraDesc = item.custom_field_values
        .filter((cf: any) => cf.field_value)
        .map((cf: any) => \`\${cf.custom_field_definitions?.field_name}: \${cf.field_value}\`)
        .join("\\n");
    }
    onChange(index, "description", item.description ? (extraDesc ? \`\${item.description}\\n\${extraDesc}\` : item.description) : extraDesc);
  `.trim();

  if (content.includes(oldOnChangeDesc)) {
    content = content.replace(new RegExp(oldOnChangeDesc.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), newOnChangeDesc);
    changed = true;
  }

  // Also check if \`supabase.from("items").select("*, tax_rates(name, rate)")\` is used
  if (content.includes('supabase.from("items").select("*, tax_rates(name, rate)")')) {
    content = content.replace(
      'supabase.from("items").select("*, tax_rates(name, rate)")',
      'supabase.from("items").select("*, tax_rates(name, rate), custom_field_values(field_value, custom_field_definitions(field_name))")'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(\`Updated \${file}\`);
    updatedCount++;
  }
}

console.log(\`Total files updated: \${updatedCount}\`);
