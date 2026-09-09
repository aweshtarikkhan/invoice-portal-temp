const fs = require('fs');
const files = [
  'src/pages/BillBuilderPage.tsx',
  'src/pages/CreditNoteBuilderPage.tsx',
  'src/pages/DeliveryChallanBuilderPage.tsx',
  'src/pages/EstimateBuilderPage.tsx',
  'src/pages/GrnBuilderPage.tsx',
  'src/pages/PurchaseOrderBuilderPage.tsx'
];

const target = `<Input placeholder="1" type="number" className="h-8 text-xs text-center font-medium" onFocus={(e) => e.target.select()} onBlur={(e) => { if (!e.target.value || parseFloat(e.target.value) <= 0) onChange(index, "quantity", 1); }} value={line.quantity} onChange={(e) => onChange(index, "quantity", e.target.value === "" ? "" : (parseFloat(e.target.value) || 0))} min={0} step="0.01" />`;

const replacement = `<Input 
            placeholder="1" 
            type="number" 
            className="h-8 text-xs text-center font-medium" 
            onFocus={(e) => e.target.select()} 
            onBlur={(e) => { if (!e.target.value || parseFloat(e.target.value) <= 0) onChange(index, "quantity", 1); }} 
            value={line.quantity} 
            onChange={(e) => {
              let val = e.target.value;
              if (val !== "") {
                const u = (line.unit || "").toLowerCase();
                if (u === "pcs" || u === "pieces" || u === "box" || u === "boxes" || u === "nos") {
                  val = String(Math.floor(parseFloat(val) || 0));
                }
              }
              onChange(index, "quantity", val === "" ? "" : (parseFloat(val) || 0));
            }} 
            min={0} 
            step={["pcs", "pieces", "box", "boxes", "nos"].includes((line.unit || "").toLowerCase()) ? "1" : "0.01"} 
          />`;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(f, content);
    console.log('Updated ' + f);
  } else {
    console.log('Target not found in ' + f);
  }
});
