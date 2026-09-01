const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// add icons to import
code = code.replace(/ShoppingCart\s*\}/, 'ShoppingCart, BrainCircuit, MessageSquareQuote }');

// add mappings
code = code.replace(/if\s*\(i\.icon\s*===\s*"Image"\)\s*itemIcon\s*=\s*ImageIcon;/, 
  'if (i.icon === "Image") itemIcon = ImageIcon;\n          if (i.icon === "BrainCircuit") itemIcon = BrainCircuit;\n          if (i.icon === "MessageSquareQuote") itemIcon = MessageSquareQuote;'
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log("Updated icons");
