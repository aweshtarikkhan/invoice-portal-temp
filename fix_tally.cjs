const fs = require('fs');
let sync = fs.readFileSync('src/pages/TallySyncPage.tsx', 'utf8');

const search = `            const payData: any = {
              org_id: org.id,
              payment_date: txn.date || new Date().toISOString(),
              amount: txn.amount,
              payment_method: "Bank Transfer", // Default for Tally
              reference_number: txn.reference,
              notes: txn.narration || "",
              type: txn.type
            };

            if (txn.type === "payment_received") payData.client_id = partyId;
            else payData.vendor_id = partyId;

            await supabase.from("payments").insert(payData);`;

const replace = `            const payData: any = {
              org_id: org.id,
              payment_date: txn.date || new Date().toISOString(),
              amount: txn.amount,
              payment_mode: "bank_transfer",
              reference_number: txn.reference || null,
              notes: txn.narration || ""
            };

            if (txn.type === "payment_received") {
              payData.client_id = partyId;
              payData.payment_number = "PAY-" + Math.floor(Math.random() * 1000000);
              await supabase.from("payments").insert(payData);
            } else {
              payData.vendor_id = partyId;
              payData.payment_number = "BPAY-" + Math.floor(Math.random() * 1000000);
              await supabase.from("bill_payments").insert(payData);
            }`;

if (sync.includes(search)) {
  sync = sync.replace(search, replace);
  fs.writeFileSync('src/pages/TallySyncPage.tsx', sync);
  console.log('Fixed payments insert');
} else {
  console.log('Search string not found');
}
