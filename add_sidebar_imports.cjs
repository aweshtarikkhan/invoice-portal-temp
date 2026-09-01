const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// replace icons
if (!code.includes("BrainCircuit")) {
  code = code.replace(/Image as ImageIcon,\n\} from "lucide-react";/, 'Image as ImageIcon,\n  BrainCircuit,\n  MessageSquareQuote,\n  Sparkles,\n} from "lucide-react";');
}

fs.writeFileSync('src/components/layout/AppSidebar.tsx', code, 'utf8');
console.log("Imports updated");
