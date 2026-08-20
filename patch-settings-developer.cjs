const fs = require('fs');

let settingsCode = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

if (!settingsCode.includes('DeveloperSettingsTab')) {
  settingsCode = settingsCode.replace(
    'import { WhatsAppSettingsTab } from "@/components/settings/WhatsAppSettingsTab";',
    'import { WhatsAppSettingsTab } from "@/components/settings/WhatsAppSettingsTab";\nimport { DeveloperSettingsTab } from "@/components/settings/DeveloperSettingsTab";'
  );
  
  settingsCode = settingsCode.replace(
    '<TabsTrigger value="taxes">Tax Rates</TabsTrigger>',
    '<TabsTrigger value="taxes">Tax Rates</TabsTrigger>\n          <TabsTrigger value="developer">Developer & API</TabsTrigger>'
  );
  
  settingsCode = settingsCode.replace(
    '</Tabs>',
    '  <TabsContent value="developer" className="space-y-6 mt-4">\n            <DeveloperSettingsTab />\n          </TabsContent>\n        </Tabs>'
  );
  
  fs.writeFileSync('src/pages/SettingsPage.tsx', settingsCode);
  console.log("Patched SettingsPage");
}
