const fs = require('fs');
let code = fs.readFileSync('src/store/feature-store.ts', 'utf8');

if (!code.includes('/crm/integrations')) {
  code = code.replace(
    '{ key: "marketing", title: "Marketing & Posters", description: "Design promotional content", icon: "Image", url: "/marketing" },',
    '{ key: "marketing", title: "Marketing & Posters", description: "Design promotional content", icon: "Image", url: "/marketing" },\n        { key: "integrations", title: "Integrations & API", description: "Lead sources & webhooks", icon: "Link2", url: "/crm/integrations" },'
  );
  fs.writeFileSync('src/store/feature-store.ts', code);
  console.log("Patched feature-store.ts");
}
