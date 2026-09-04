const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://sidb:KTcGH5JLK7APcSRX@89.116.32.98:5432/sidb?schema=public"
});

async function run() {
  await client.connect();
  try {
    const query = 
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS subscription_interval VARCHAR DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS whatsapp_msg_limit INTEGER DEFAULT 100,
      ADD COLUMN IF NOT EXISTS whatsapp_msg_used INTEGER DEFAULT 0;
    ;
    const res = await client.query(query);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
