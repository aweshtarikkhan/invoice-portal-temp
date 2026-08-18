const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function run() {
  const res = await fetch("https://api.resend.com/domains/a206d19c-c6aa-447e-b096-269aec80def4", {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
