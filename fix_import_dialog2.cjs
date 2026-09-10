const fs = require('fs');
let c = fs.readFileSync('src/components/shared/ImportDialog.tsx', 'utf8');

c = c.replace(/const val = cell && typeof cell === "object" && "text" in cell \? \(cell as any\)\.text : cell;/g, 
`let val = cell && typeof cell === "object" && "text" in cell ? (cell as any).text : cell;
              if (val instanceof Date) {
                 if (!isNaN(val.getTime())) {
                   val = new Date(val.getTime() - val.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                 } else {
                   val = "";
                 }
              }`);

fs.writeFileSync('src/components/shared/ImportDialog.tsx', c);
console.log('Fixed ImportDialog regex');
