import { Client } from 'pg';

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.itgbnkinmlyemwnhnnwk',
  password: 'Naman#p0807',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function check() {
  await client.connect();
  
  // Check departments
  const depts = await client.query('SELECT id, name, is_active FROM departments ORDER BY name');
  console.log('📁 Departments:', depts.rows.length);
  depts.rows.forEach((d: any) => console.log(`   ${d.is_active ? '✅' : '❌'} ${d.name} (${d.id})`));
  
  // Check categories
  const cats = await client.query('SELECT id, name, custom_fields FROM asset_categories ORDER BY name');
  console.log('\n📂 Asset Categories:', cats.rows.length);
  cats.rows.forEach((c: any) => console.log(`   ✅ ${c.name} — custom_fields: ${JSON.stringify(c.custom_fields)}`));
  
  // Check profiles
  const profiles = await client.query('SELECT id, name, email, role FROM profiles ORDER BY role');
  console.log('\n👤 Profiles:', profiles.rows.length);
  profiles.rows.forEach((p: any) => console.log(`   ✅ ${p.name} (${p.email}) — ${p.role}`));
  
  // Check tables
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
  console.log('\n📊 Tables:', tables.rows.length);
  tables.rows.forEach((t: any) => console.log(`   ✅ ${t.table_name}`));
  
  await client.end();
}

check();
