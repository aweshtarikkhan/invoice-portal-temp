const fs = require('fs');

let content = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

const search = `      } else {
        total += tdsTcsAmount;
      }
    }`;

const replace = `      } else {
        total += tdsTcsAmount;
      }
    }

    let finalAdjustment = autoRoundOff ? 0 : adjustment;
    let finalAdjustmentName = autoRoundOff ? "Round Off" : adjustmentName;

    if (autoRoundOff) {
      const roundedTotal = Math.round(total);
      finalAdjustment = Number((roundedTotal - total).toFixed(2));
      total = roundedTotal;
    }`;

content = content.replace(search, replace);

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', content, 'utf8');
console.log('Fixed finalAdjustmentName scope again!');
