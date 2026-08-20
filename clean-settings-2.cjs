const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Find the block and remove it
const oldCode = `<TabsContent value="developer" className="space-y-6 mt-4">
            <DeveloperSettingsTab />
          </TabsContent>`;
          
// Replace any exact or fuzzy match
code = code.replace(/<TabsContent value="developer" className="space-y-6 mt-4">[\s\S]*?<DeveloperSettingsTab \/>[\s\S]*?<\/TabsContent>/, '');

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
console.log("Cleaned SettingsPage.tsx");
