const fs = require('fs');
let code = fs.readFileSync('src/store/feature-store.ts', 'utf8');

// Add isUpcoming to FeatureItem
code = code.replace(/url: string;/, 'url: string;\n  isUpcoming?: boolean;');

// Add Feedback to CRM
code = code.replace(/\{\s*key:\s*"integrations"[^\}]+\},/, match => match + '\n        { key: "feedback", title: "Customer Feedback", description: "Customer Feedback Management", icon: "MessageSquareQuote", url: "#", isUpcoming: true },');

// Add AI Analysis to Reports
code = code.replace(/\{\s*key:\s*"business-report"[^\}]+\},/, match => match + '\n        { key: "ai-analysis", title: "AI & Business Analysis", description: "AI & Business Analysis", icon: "BrainCircuit", url: "#", isUpcoming: true },');

fs.writeFileSync('src/store/feature-store.ts', code, 'utf8');
console.log("Updated feature-store.ts");
