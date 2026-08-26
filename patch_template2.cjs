const fs = require('fs');
let code = fs.readFileSync('src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx', 'utf8');

// Add custom fields
code = code.replace(
  `                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>Reverse Charge</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>{invoice.reverse_charge ? "Yes" : "No"}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>`,
  `                  <tr>
                    <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>Reverse Charge</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                    <td style={{ padding: "3px 0", textAlign: "left" }}>{invoice.reverse_charge ? "Yes" : "No"}</td>
                  </tr>
                </>
              )}
              {org?.custom_fields && org.custom_fields.map((cf: any, idx: number) => (
                <tr key={"cf"+idx}>
                  <td style={{ padding: "3px 0", fontWeight: 600, textAlign: "left" }}>{cf.name}</td>
                  <td style={{ padding: "3px 0", textAlign: "left" }}>:</td>
                  <td style={{ padding: "3px 0", textAlign: "left" }}>{cf.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>`
);

// Add shipping address calculation
code = code.replace(
  `  const billToAddressLines: string[] = useMemo(() => {
    const addr = invoice?.billing_address || (invoice.clients as any)?.address || (invoice.vendors as any)?.address;`,
  `  const shipToAddressLines: string[] = useMemo(() => {
    if (org?.shipping_same_as_billing) return [];
    const addr = invoice?.shipping_address || (invoice.clients as any)?.shipping_address;
    if (!addr) return [];
    try {
      const a = typeof addr === "string" ? JSON.parse(addr) : addr;
      const res: string[] = [];
      if (a?.street) res.push(a.street);
      const cityLine = [a?.city, a?.state, a?.zip].filter(Boolean).join(", ");
      if (cityLine) res.push(cityLine);
      if (a?.country) res.push(a.country);
      return res;
    } catch {
      return [String(addr)];
    }
  }, [invoice?.shipping_address, org?.shipping_same_as_billing]);

  const billToAddressLines: string[] = useMemo(() => {
    const addr = invoice?.billing_address || (invoice.clients as any)?.address || (invoice.clients as any)?.billing_address || (invoice.vendors as any)?.address;`
);

// Change Bill To UI to support Ship To side by side
code = code.replace(
  `      {/* Bill To */}
      <div style={{ border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden", marginBottom: 15 }}>
        <div style={{ backgroundColor: navy, color: "white", padding: "6px 12px", fontSize: 11, fontWeight: 700 }}>
          BILL TO
        </div>
        <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
            {billToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
          </div>
          {hasGst && clientGst && (
            <div style={{ fontSize: 11, lineHeight: 1.6, minWidth: 200 }}>
              <div style={{ display: "flex" }}>
                <span style={{ width: 50, fontWeight: 600 }}>GSTIN</span>
                <span style={{ width: 15 }}>:</span>
                <span>{clientGst}</span>
              </div>
              {invoice.billing_address && (
                <div style={{ display: "flex", marginTop: 2 }}>
                  <span style={{ width: 50, fontWeight: 600 }}>State</span>
                  <span style={{ width: 15 }}>:</span>
                  <span>{
                    (() => {
                      try {
                        const a = typeof invoice.billing_address === "string" ? JSON.parse(invoice.billing_address) : invoice.billing_address;
                        const st = INDIAN_STATES.find(s => s.code === a?.state || s.name === a?.state);
                        return st ? \`\${st.name} (\${st.code})\` : a?.state || "-";
                      } catch { return "-"; }
                    })()
                  }</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>`,
  `      {/* Bill To & Ship To */}
      <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
        <div style={{ flex: 1, border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ backgroundColor: navy, color: "white", padding: "6px 12px", fontSize: 11, fontWeight: 700 }}>
            BILL TO
          </div>
          <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, lineHeight: 1.6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
              {billToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
              {hasGst && clientGst && (
                <div style={{ display: "flex", marginTop: 4 }}>
                  <span style={{ fontWeight: 600, marginRight: 4 }}>GSTIN:</span>
                  <span>{clientGst}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {shipToAddressLines.length > 0 && (
          <div style={{ flex: 1, border: "1px solid " + grayBorder, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ backgroundColor: navy, color: "white", padding: "6px 12px", fontSize: 11, fontWeight: 700 }}>
              SHIP TO
            </div>
            <div style={{ padding: "12px", display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: darkBlue, marginBottom: 4 }}>{clientName}</div>
                {shipToAddressLines.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </div>
          </div>
        )}
      </div>`
);

fs.writeFileSync('src/components/invoice/ProfessionalNavyInvoiceTemplate.tsx', code, 'utf8');
console.log('patched ProfessionalNavyInvoiceTemplate.tsx');
