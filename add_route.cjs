const fs = require('fs');

let c = fs.readFileSync('src/App.tsx', 'utf8');

if (!c.includes('PartnerWithUsPage')) {
  // Add import
  c = c.replace(
    'import LandingPage from "./pages/LandingPage";',
    'import LandingPage from "./pages/LandingPage";\nimport PartnerWithUsPage from "./pages/PartnerWithUsPage";'
  );

  // Add Route
  c = c.replace(
    '<Route path="/" element={<LandingPage />} />',
    '<Route path="/" element={<LandingPage />} />\n            <Route path="/partner-with-us" element={<PartnerWithUsPage />} />'
  );
  
  fs.writeFileSync('src/App.tsx', c);
  console.log('Added route to App.tsx');
} else {
  console.log('Route already exists');
}
