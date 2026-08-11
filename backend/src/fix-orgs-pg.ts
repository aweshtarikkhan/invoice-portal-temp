import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function fix() {
  const client = new Client({
    connectionString: "postgresql://sidb:KTcGH5JLK7APcSRX@89.116.32.98:5432/sidb?schema=public"
  });

  await client.connect();

  // Find organizations with no members
  const { rows: orgs } = await client.query(`
    SELECT o.id, o.name, o.created_at
    FROM organizations o
    LEFT JOIN organization_members m ON o.id = m.org_id
    WHERE m.id IS NULL
    ORDER BY o.created_at DESC
  `);

  console.log(`Found ${orgs.length} orgs with no members:`, orgs);

  if (orgs.length > 0) {
    // Find the latest user
    const { rows: users } = await client.query(`
      SELECT id, user_id, email, org_id
      FROM profiles
      ORDER BY created_at DESC
      LIMIT 1
    `);
    console.log("Using user:", users[0]);
    const user = users[0];

    for (const org of orgs) {
      console.log(`Inserting member for org ${org.name}...`);
      
      const permissions = ["sales", "catalog", "system_settings", "business_settings", "expenses", "payroll", "banking", "marketing"]; // some default permissions
      
      await client.query(`
        INSERT INTO organization_members (org_id, user_id, email, role, status, permissions)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [org.id, user.user_id, user.email, 'admin', 'active', permissions]);
      
      console.log("Inserted!");
    }
  }

  await client.end();
}

fix().catch(console.error);
