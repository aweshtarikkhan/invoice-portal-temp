const fs = require('fs');

let content = fs.readFileSync('src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx', 'utf8');

// 1. GST NO fix
content = content.replace(
  `            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, color: "#374151" }}>
              {addressLines.length > 0 && (`,
  `            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 10, color: "#374151" }}>
              {org?.gst_number && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: navy }}>
                  <span>GSTIN: {org.gst_number}</span>
                </div>
              )}
              {addressLines.length > 0 && (`
);

// 2. Client Address fix
content = content.replace(
  `  const billToAddressLines: string[] = useMemo(() => {
    if (!invoice?.billing_address) return [];
    try {
      const a = typeof invoice.billing_address === "string" ? JSON.parse(invoice.billing_address) : invoice.billing_address;`,
  `  const billToAddressLines: string[] = useMemo(() => {
    const addr = invoice?.billing_address || (invoice.clients as any)?.address || (invoice.vendors as any)?.address;
    if (!addr) return [];
    try {
      const a = typeof addr === "string" ? JSON.parse(addr) : addr;`
);

content = content.replace(
  `        <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
            {billToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
          </div>`,
  `        <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
            {billToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
          </div>`
); // Nothing changed here, just verifying.

// 3 & 4. Item Name and GST fix
content = content.replace(
  `            {lines.map((line, idx) => {
              const qty = Number(line.quantity) || 0;
              const rate = Number(line.rate) || 0;
              const taxable = qty * rate;
              let taxRate = 0;
              if (hasGst) {
                if (line.tax_rate) taxRate = Number(line.tax_rate);
                else if (line.tax_rates && line.tax_rates.rate) taxRate = Number(line.tax_rates.rate);
              }
              const taxAmount = (taxable * taxRate) / 100;
              const totalAmount = taxable + taxAmount;

              return (
                <tr key={idx}>
                  <td style={{ ...tdStyle, borderLeft: "none" }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>{line.description}</td>
                  {hasGst && <td style={{ ...tdStyle }}>{line.hsn_sac || "-"}</td>}
                  <td style={{ ...tdStyle }}>{qty}</td>
                  <td style={{ ...tdStyle }}>{line.unit || "Pcs"}</td>
                  <td style={{ ...tdStyle }}>{fmt(rate)}</td>
                  <td style={{ ...tdStyle }}>{fmt(taxable)}</td>
                  {hasGst && <td style={{ ...tdStyle }}>{taxRate ? \`\${taxRate}%\` : "-"}</td>}
                  {hasGst && <td style={{ ...tdStyle }}>{taxAmount ? fmt(taxAmount) : "-"}</td>}
                  <td style={{ ...tdStyle, borderRight: "none" }}>{fmt(totalAmount)}</td>
                </tr>
              );
            })}`,
  `            {lines.map((line, idx) => {
              const qty = Number(line.quantity) || 0;
              const rate = Number(line.rate) || 0;
              const taxable = qty * rate;
              let taxRate = 0;
              if (hasGst) {
                if (line.tax_rate !== undefined && line.tax_rate !== null) taxRate = Number(line.tax_rate);
                else if (line.tax_rates && line.tax_rates.rate !== undefined && line.tax_rates.rate !== null) taxRate = Number(line.tax_rates.rate);
                else if (line.items?.tax_rate !== undefined && line.items?.tax_rate !== null) taxRate = Number(line.items.tax_rate);
                else if (line.tax_amount && taxable > 0) taxRate = Math.round((Number(line.tax_amount) / taxable) * 100);
              }
              const taxAmount = Number(line.tax_amount) || ((taxable * taxRate) / 100);
              const totalAmount = taxable + taxAmount;
              const itemName = line.items?.name || line.name;

              return (
                <tr key={idx}>
                  <td style={{ ...tdStyle, borderLeft: "none" }}>{idx + 1}</td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>
                    {itemName ? (
                      <>
                        <div style={{ fontWeight: 600, marginBottom: line.description ? 2 : 0 }}>{itemName}</div>
                        {line.description && <div style={{ fontSize: 9, color: "#4b5563", whiteSpace: "pre-wrap" }}>{line.description}</div>}
                      </>
                    ) : (
                      <div style={{ whiteSpace: "pre-wrap" }}>{line.description}</div>
                    )}
                  </td>
                  {hasGst && <td style={{ ...tdStyle }}>{line.hsn_sac || "-"}</td>}
                  <td style={{ ...tdStyle }}>{qty}</td>
                  <td style={{ ...tdStyle }}>{line.unit || "Pcs"}</td>
                  <td style={{ ...tdStyle }}>{fmt(rate)}</td>
                  <td style={{ ...tdStyle }}>{fmt(taxable)}</td>
                  {hasGst && <td style={{ ...tdStyle }}>{taxRate ? \`\${taxRate}%\` : "-"}</td>}
                  {hasGst && <td style={{ ...tdStyle }}>{taxAmount ? fmt(taxAmount) : "-"}</td>}
                  <td style={{ ...tdStyle, borderRight: "none" }}>{fmt(totalAmount)}</td>
                </tr>
              );
            })}`
);

// 5. Total GST Breakdown & Subtotal removal
content = content.replace(
  `              {hasGst && (
                <tr>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>Total GST Amount</td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(Number(invoice.total_tax))}</td>
                </tr>
              )}
              <tr>
                <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>Sub Total</td>
                <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(Number(invoice.subtotal ?? invoice.total) + Number(invoice.total_tax))}</td>
              </tr>`,
  `              {hasGst && taxBreakdown && taxBreakdown.length > 0 ? (
                taxBreakdown.map((t, i) => (
                  <tr key={i}>
                    <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>{t.name}</td>
                    <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(t.amount)}</td>
                  </tr>
                ))
              ) : hasGst ? (
                <tr>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder }}>Total GST Amount</td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid " + grayBorder, textAlign: "right" }}>₹ {fmt(Number(invoice.total_tax))}</td>
                </tr>
              ) : null}`
);

fs.writeFileSync('src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx', content, 'utf8');
console.log('patched ProfessionalNavyInvoiceTemplate.tsx');
