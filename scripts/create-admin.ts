import { Client } from 'pg';

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.itgbnkinmlyemwnhnnwk',
  password: 'Naman#p0807',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function createAdmin() {
  await client.connect();
  
  const email = 'admin@assetflow.com';
  const password = 'Admin@123';
  
  const { rows: uuidRows } = await client.query("SELECT uuid_generate_v4() as id");
  const userId = uuidRows[0].id;
  
  const { rows: hashRows } = await client.query(`SELECT crypt('${password}', gen_salt('bf')) as hash`);
  const passwordHash = hashRows[0].hash;
  
  try {
    await client.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, confirmation_token,
        recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '${userId}',
        'authenticated',
        'authenticated',
        '${email}',
        '${passwordHash}',
        now(), now(), now(),
        '', '', '', ''
      )
    `);
    console.log('✅ Auth user created');
  } catch (err: any) {
    if (err.code === '23505') {
      console.log('⚠️  Auth user already exists, fetching ID...');
      const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = '${email}'`);
      if (rows.length > 0) {
        await client.query(`UPDATE profiles SET role = 'Admin' WHERE id = '${rows[0].id}'`);
        console.log('✅ Updated existing user to Admin');
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        await client.end();
        return;
      }
    } else {
      console.error('❌ Error creating auth user:', err.message);
      await client.end();
      return;
    }
  }
  
  try {
    await client.query(`
      INSERT INTO profiles (id, name, email, role, is_active) 
      VALUES ('${userId}', 'System Admin', '${email}', 'Admin', true)
      ON CONFLICT (id) DO UPDATE SET role = 'Admin'
    `);
    console.log('✅ Profile created as Admin');
  } catch (err: any) {
    console.error('❌ Error creating profile:', err.message);
  }
  
  console.log(`\n📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  
  await client.end();
}

createAdmin();
