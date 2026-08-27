const fs = require('fs');
let code = fs.readFileSync('src/pages/TemplateCustomizationPage.tsx', 'utf8');

code = code.replace(
  `    { id: "professional_navy", name: "Professional Navy GST", description: "Classic professional navy template matching standard business format with strict table borders." },`,
  `    { id: "professional_navy", name: "Professional Navy GST", description: "Classic professional navy template matching standard business format with strict table borders." },
  { id: "classic_tabular", name: "Classic Tabular (New)", description: "Detailed tabular format matching standard Indian tax invoice." },
  { id: "modern_navy", name: "Modern Navy Yellow (New)", description: "Sleek navy and yellow themed template." },
  { id: "modern_teal", name: "Modern Teal (New)", description: "Professional teal themed modern invoice." },
  { id: "modern_crimson", name: "Modern Crimson (New)", description: "Professional crimson/red themed modern invoice." },`
);

fs.writeFileSync('src/pages/TemplateCustomizationPage.tsx', code, 'utf8');
console.log('patched TemplateCustomizationPage');
