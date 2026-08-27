const fs = require('fs');

let content = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

// Use a more robust regex that ignores spacing
content = content.replace(
  /let total = baseTotalBeforeTdsTcs;[\s\S]*?total \+= tdsTcsAmount;\s*\}\s*\}/,
  `let total = baseTotalBeforeTdsTcs;
    if (tdsTcsApplicable) {
      if (tdsTcsType === "tds") {
        total -= tdsTcsAmount;
      } else {
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
console.log('Fixed finalAdjustmentName scope again with strong regex!');
