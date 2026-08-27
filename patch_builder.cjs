const fs = require('fs');

let content = fs.readFileSync('src/pages/InvoiceBuilderPage.tsx', 'utf8');

// 1. Add states for autoRoundOff, showBankDetails, showTerms, showNotes
content = content.replace(
  /const \[adjustmentName, setAdjustmentName\] = useState\("Adjustment"\);/g,
  `const [adjustmentName, setAdjustmentName] = useState("Adjustment");
  const [autoRoundOff, setAutoRoundOff] = useState(true);
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [showNotes, setShowNotes] = useState(true);`
);

// 2. Initialize them from inv.metadata
content = content.replace(
  /setAdjustmentName\(inv\.adjustment_name \|\| "Adjustment"\);/g,
  `setAdjustmentName(inv.adjustment_name || "Adjustment");
        if (inv.metadata) {
          if ((inv.metadata as any).auto_round_off !== undefined) setAutoRoundOff((inv.metadata as any).auto_round_off);
          if ((inv.metadata as any).show_bank_details !== undefined) setShowBankDetails((inv.metadata as any).show_bank_details);
          if ((inv.metadata as any).show_terms !== undefined) setShowTerms((inv.metadata as any).show_terms);
          if ((inv.metadata as any).show_notes !== undefined) setShowNotes((inv.metadata as any).show_notes);
        }`
);

// 3. Add to metadata in handleSave
content = content.replace(
  /shipping_same_as_billing: shippingSameAsBilling,/g,
  `shipping_same_as_billing: shippingSameAsBilling,
          auto_round_off: autoRoundOff,
          show_bank_details: showBankDetails,
          show_terms: showTerms,
          show_notes: showNotes,`
);

// 4. Modify calculate logic
// Replace baseTotalBeforeTdsTcs
content = content.replace(
  /const baseTotalBeforeTdsTcs = discountedSubtotal \+ totalTax \+ shippingCharge \+ adjustment - expenses;/g,
  `const baseTotalBeforeTdsTcs = discountedSubtotal + totalTax + shippingCharge + (autoRoundOff ? 0 : adjustment) - expenses;`
);

// After total computation
content = content.replace(
  /      \}\n    \}\n\n    const fmt = /g,
  `      }
    }
    
    let finalAdjustment = autoRoundOff ? 0 : adjustment;
    let finalAdjustmentName = autoRoundOff ? "Round Off" : adjustmentName;

    if (autoRoundOff) {
      const roundedTotal = Math.round(total);
      finalAdjustment = Number((roundedTotal - total).toFixed(2));
      total = roundedTotal;
    }

    const fmt = `
);

// Replace saving payload to use finalAdjustment
content = content.replace(
  /adjustment,\n        adjustment_name: adjustmentName,/g,
  `adjustment: finalAdjustment,
        adjustment_name: finalAdjustmentName,`
);

// 5. Update UI for adjustment
content = content.replace(
  /<Input\s*className="h-7 w-24 text-xs"\s*value=\{adjustmentName\}\s*onChange=\{\(e\) => setAdjustmentName\(e\.target\.value\)\}\s*\/>\s*<Input\s*type="number"\s*className="h-7 w-24 text-xs text-right"\s*value=\{adjustment\}\s*onChange=\{\(e\) => setAdjustment\(parseFloat\(e\.target\.value\) \|\| 0\)\}\s*\/>/g,
  `<Input
                  className="h-7 w-24 text-xs"
                  value={finalAdjustmentName}
                  onChange={(e) => setAdjustmentName(e.target.value)}
                  disabled={autoRoundOff}
                />
                <Input
                  type="number"
                  className="h-7 w-24 text-xs text-right"
                  value={finalAdjustment}
                  onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                  disabled={autoRoundOff}
                />`
);

// 6. Add UI for Display toggles (above deduct stock)
content = content.replace(
  /<label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted\/40">\s*<Checkbox\s*checked=\{deductStock\}/g,
  `<div className="space-y-2 rounded-md border p-3">
              <div className="text-sm font-medium">Display Options</div>
              <p className="text-xs text-muted-foreground mb-2">Configure what appears on the invoice PDF.</p>
              
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={autoRoundOff} onCheckedChange={(v) => setAutoRoundOff(!!v)} />
                <span className="text-sm font-medium">Auto Round Off Total</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={showBankDetails} onCheckedChange={(v) => setShowBankDetails(!!v)} />
                <span className="text-sm font-medium">Show Bank / UPI Details</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={showTerms} onCheckedChange={(v) => setShowTerms(!!v)} />
                <span className="text-sm font-medium">Show Terms & Conditions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 p-1 rounded">
                <Checkbox checked={showNotes} onCheckedChange={(v) => setShowNotes(!!v)} />
                <span className="text-sm font-medium">Show Notes</span>
              </label>
            </div>

            <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
              <Checkbox
                checked={deductStock}`
);

fs.writeFileSync('src/pages/InvoiceBuilderPage.tsx', content, 'utf8');
console.log('InvoiceBuilderPage patched!');
