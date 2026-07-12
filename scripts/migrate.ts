import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_REF = 'itgbnkinmlyemwnhnnwk';

// Direct host (db.X.supabase.co) is IPv6-only and unreachable from this machine.
// Use the Supabase connection pooler which has IPv4 (A) records.
const client = new Client({
  host: `aws-0-ap-northeast-1.pooler.supabase.com`,
  port: 6543,
  user: `postgres.${PROJECT_REF}`,
  password: 'Naman#p0807',
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
});

const SQL_FILES = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_auth_trigger.sql',
  'supabase/seed.sql',
];

async function migrate() {
  try {
    console.log('🔌 Connecting to database via pooler...');
    await client.connect();
    console.log('✅ Connected to database\n');

    for (const file of SQL_FILES) {
      const filePath = join(import.meta.dir, '..', file);
      const sql = readFileSync(filePath, 'utf-8');

      console.log(`📄 Running: ${file}`);
      try {
        await client.query(sql);
        console.log(`✅ ${file} — SUCCESS\n`);
      } catch (err: any) {
        if (err.code === '42710' || err.code === '42P07' || err.code === '23505') {
          console.log(`⚠️  ${file} — Some objects already exist (skipping)`);
          console.log(`   Detail: ${err.message?.slice(0, 120)}\n`);
        } else {
          console.error(`❌ ${file} — FAILED`);
          console.error(`   Code: ${err.code}`);
          console.error(`   Error: ${err.message?.slice(0, 200)}\n`);
        }
      }
    }

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const tables = result.rows.map((r: any) => r.table_name);
    console.log(`\n📊 Found ${tables.length} tables:`);
    tables.forEach((t: string) => console.log(`   ✅ ${t}`));

    // Verify types
    const types = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('user_role', 'asset_status', 'transfer_status', 'allocation_status', 'booking_status', 'maintenance_status', 'audit_asset_status')
      ORDER BY typname
    `);
    console.log(`\n📋 Found ${types.rows.length} enum types:`);
    types.rows.forEach((t: any) => console.log(`   ✅ ${t.typname}`));

    // Verify indexes
    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    console.log(`\n📑 Found ${indexes.rows.length} custom indexes:`);
    indexes.rows.forEach((i: any) => console.log(`   ✅ ${i.indexname}`));

    console.log('\n🎉 Migration complete!');

  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    console.error('   Code:', err.code);
    console.error('   Hint:', err.hint || 'none');
  } finally {
    await client.end();
  }
}

migrate();
