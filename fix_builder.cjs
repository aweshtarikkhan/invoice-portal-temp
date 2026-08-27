const fs = require('fs');

let content = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

// There are two `const fmt = (n: number) =>`. The second one is after tdsTcs logic in InvoiceBuilderPage.
// We can just find:
// `    if (tdsTcsApplicable) {`
// and insert after its closing brace.
content = content.replace(
  /      \} else \{\n        total \+= tdsTcsAmount;\n      \}\n    \}/g,
  `      } else {
        total += tdsTcsAmount;
      }
    }

    let finalAdjustment = autoRoundOff ? 0 : adjustment;
    let finalAdjustmentName = autoRoundOff ? "Round Off" : adjustmentName;

    if (autoRoundOff) {
      const roundedTotal = Math.round(total);
      finalAdjustment = Number((roundedTotal - total).toFixed(2));
      total = roundedTotal;
    }`
);

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', content, 'utf8');
console.log('Fixed finalAdjustmentName scope!');
