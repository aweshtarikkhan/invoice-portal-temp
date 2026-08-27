const fs = require('fs');
let code = fs.readFileSync('src/lib/document-templates.ts', 'utf8');

const newTemplates = `  {
    id: "classic_tabular",
    name: "Classic Tabular (New)",
    description: "Detailed tabular format matching standard Indian tax invoice.",
    preview: "bg-slate-50 border-slate-900/20",
    features: ["Classic Tabular layout", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "modern_navy",
    name: "Modern Navy Yellow (New)",
    description: "Sleek navy and yellow themed template.",
    preview: "bg-blue-50 border-blue-900/20",
    features: ["Modern Navy layout", "Yellow accents", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "modern_teal",
    name: "Modern Teal (New)",
    description: "Professional teal themed modern invoice.",
    preview: "bg-teal-50 border-teal-900/20",
    features: ["Modern Teal layout", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
  {
    id: "modern_crimson",
    name: "Modern Crimson (New)",
    description: "Professional crimson/red themed modern invoice.",
    preview: "bg-rose-50 border-rose-900/20",
    features: ["Modern Crimson layout", "Amount in words", "Bank details & QR", "Custom Tax Summary"],
    recommendedPaperSize: "a4",
  },
`;

code = code.replace(
  `    recommendedPaperSize: "a4",
  },
] as const;`,
  `    recommendedPaperSize: "a4",
  },
${newTemplates}] as const;`
);

fs.writeFileSync('src/lib/document-templates.ts', code, 'utf8');
console.log('patched document-templates.ts');
