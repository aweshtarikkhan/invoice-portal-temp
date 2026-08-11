require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const dbUrl = 'postgresql://sidb:KTcGH5JLK7APcSRX@89.116.32.98:5432/sidb?schema=public';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'awesh@invoice.com';
  const password = '12345678';

  // 1. Sign up user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error && !error.message.includes('already registered') && !error.message.includes('User already registered')) {
    console.error('Error signing up:', error);
    return;
  }
  
  let userId = data?.user?.id;

  // If user already exists, fetch the ID from DB
  if (!userId) {
     const client = new Client({ connectionString: dbUrl });
     await client.connect();
     const res = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
     if (res.rows.length > 0) {
        userId = res.rows[0].id;
     } else {
        console.error('User not found and sign up failed.');
     }
     await client.end();
  }

  if (userId) {
    console.log('User ID:', userId);
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await client.query('INSERT INTO platform_admins (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
    console.log('Successfully added to platform_admins');
    await client.end();
  }
}

main().catch(console.error);
