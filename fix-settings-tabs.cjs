const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// The bad snippet we injected:
const badSnippet = `            <TabsContent value="developer" className="space-y-6 mt-4">
            <DeveloperSettingsTab />
            </TabsContent>
          </Tabs>
          </TabsContent>`;

const correctSnippet = `          </Tabs>
          </TabsContent>`;

if (code.includes(badSnippet)) {
  code = code.replace(badSnippet, correctSnippet);
}

// Now insert Developer tab AT THE END OF THE MAIN TABS.
// The main Tabs ends with `</Tabs>` right before `<AddWarehouseDialog`
const finalTabsClosingRegex = /<\/Tabs>\s*<AddWarehouseDialog/g;
code = code.replace(finalTabsClosingRegex, `  <TabsContent value="developer" className="space-y-6 mt-4">
            <DeveloperSettingsTab />
          </TabsContent>
        </Tabs>
        <AddWarehouseDialog`);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
console.log("Fixed Developer tab layout");
