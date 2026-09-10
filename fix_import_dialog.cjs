const fs = require('fs');
let c = fs.readFileSync('src/components/shared/ImportDialog.tsx', 'utf8');

const target = `              const cell = rowVals[idx + 1];
              const val = cell && typeof cell === "object" && "text" in cell ? (cell as any).text : cell;
              if (val !== undefined && val !== null && val !== "") hasValue = true;
              obj[k] = val ?? "";`;

const replacement = `              const cell = rowVals[idx + 1];
              let val = cell && typeof cell === "object" && "text" in cell ? (cell as any).text : cell;
              if (val instanceof Date) {
                 if (!isNaN(val.getTime())) {
                   val = new Date(val.getTime() - val.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                 } else {
                   val = "";
                 }
              }
              if (val !== undefined && val !== null && val !== "") hasValue = true;
              obj[k] = val ?? "";`;

if (c.includes(target)) {
  c = c.replace(target, replacement);
  fs.writeFileSync('src/components/shared/ImportDialog.tsx', c);
  console.log('Fixed ImportDialog');
} else {
  console.log('Target not found');
}
