const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Remove Developer & API tab trigger
code = code.replace('<TabsTrigger value="developer">Developer & API</TabsTrigger>', '');

// Remove Developer tab content
// This regex will find TabsContent value="developer" up to the end of its block
const contentRegex = /<TabsContent value="developer" className="space-y-6 mt-4">\s*<DeveloperSettingsTab \/>\s*<\/TabsContent>/;
code = code.replace(contentRegex, '');

// Also remove the import if present
code = code.replace('import { DeveloperSettingsTab } from "@/components/settings/DeveloperSettingsTab";', '');

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
console.log("Cleaned SettingsPage.tsx");
