const fs = require('fs');

let c = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

const regex = /\/\/ Check if payment exists by reference\s*if \(\!txn\.reference\) continue; \/\/ Skip empty ref payments\s*const \{ data: existingPay \} \= await supabase\.from\("payments"\)\.select\("id"\)\.eq\("org_id", org\.id\)\.eq\("reference_number", txn\.reference\)\.maybeSingle\(\);\s*if \(existingPay\) continue;\s*const payData: any = \{\s*org_id: org\.id,\s*payment_date: txn\.date \|\| new Date\(\)\.toISOString\(\),\s*amount: txn\.amount,\s*payment_mode: "bank_transfer",\s*reference_number: txn\.reference \|\| null,\s*notes: txn\.narration \|\| ""\s*\};\s*if \(txn\.type === "payment_received"\) \{\s*payData\.client_id = partyId;\s*payData\.payment_number = "PAY-" \+ Math\.floor\(Math\.random\(\) \* 1000000\);\s*const \{ error: payErr \} = await supabase\.from\("payments"\)\.insert\(payData\);\s*if \(payErr\) \{ syncErrors\.push\(\{ reason: payErr\.message, data: payData\.payment_number \}\); \}\s*\} else \{\s*payData\.vendor_id = partyId;\s*payData\.payment_number = "BPAY-" \+ Math\.floor\(Math\.random\(\) \* 1000000\);\s*const \{ error: bPayErr \} = await supabase\.from\("bill_payments"\)\.insert\(payData\);\s*if \(bPayErr\) \{ syncErrors\.push\(\{ reason: bPayErr\.message, data: payData\.payment_number \}\); \}\s*\}/m;

const replacement = `// Check if payment exists by reference
            if (!txn.reference) continue; // Skip empty ref payments
            
            if (txn.type === "payment_received") {
              const { data: existingPay } = await supabase.from("payments").select("id").eq("org_id", org.id).eq("reference_number", txn.reference).maybeSingle();
              if (existingPay) continue;

              const payData: any = {
                org_id: org.id,
                payment_date: txn.date || new Date().toISOString(),
                amount: txn.amount,
                payment_mode: "bank_transfer",
                reference_number: txn.reference || null,
                notes: txn.narration || "",
                client_id: partyId,
                payment_number: "PAY-" + Math.floor(Math.random() * 1000000)
              };
              const { error: payErr } = await supabase.from("payments").insert(payData);
              if (payErr) { syncErrors.push({ reason: payErr.message, data: payData.payment_number }); }
            } else {
              const { data: existingBPay } = await supabase.from("bill_payments").select("id").eq("org_id", org.id).eq("reference", txn.reference).maybeSingle();
              if (existingBPay) continue;

              const bPayData: any = {
                org_id: org.id,
                payment_date: txn.date || new Date().toISOString(),
                amount: txn.amount,
                payment_method: "bank_transfer",
                reference: txn.reference || null,
                notes: txn.narration || "",
                vendor_id: partyId
              };
              const { error: bPayErr } = await supabase.from("bill_payments").insert(bPayData);
              if (bPayErr) { syncErrors.push({ reason: bPayErr.message, data: txn.reference }); }
            }`;

if (c.match(regex)) {
  c = c.replace(regex, replacement);
  fs.writeFileSync('src/pages/TallySyncPage.tsx', c);
  console.log('Fixed payment mappings for Creditors');
} else {
  console.log('Regex failed');
}
