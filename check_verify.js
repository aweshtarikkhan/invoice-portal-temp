const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const domainId = "a206d19c-c6aa-447e-b096-269aec80def4";

async function run() {
  const verifyRes = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
  });
  const data = await verifyRes.json();
  console.log("Verify endpoint response:", JSON.stringify(data, null, 2));
}

run();
