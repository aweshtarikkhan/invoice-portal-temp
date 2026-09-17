const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://sidb:KTcGH5JLK7APcSRX@89.116.32.98:5432/sidb?schema=public"
});

async function run() {
  await client.connect();
  try {
    const query = `
      ALTER TABLE public.organizations 
      ADD COLUMN IF NOT EXISTS signature_type VARCHAR DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS signature_image_url TEXT,
      ADD COLUMN IF NOT EXISTS signature_name VARCHAR,
      ADD COLUMN IF NOT EXISTS signature_font VARCHAR;
    `;
    const res = await client.query(query);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
