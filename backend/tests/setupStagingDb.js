// ============================================================
// setupStagingDb.js - PostgreSQL Staging Database Provisioner
// Executes official project schema.sql and seed.sql against an isolated
// PostgreSQL database with strict production safety guards.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/airline_dsa_test';

// ------------------------------------------------------------
// Safety Guard: Prohibit executing on production databases
// ------------------------------------------------------------
function assertSafeTestDatabase(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const dbName = parsed.pathname.replace(/^\//, '');
    if (!dbName.includes('test') && process.env.ALLOW_TEST_DB_WIPE !== 'true') {
      console.error(`\n[CRITICAL ERROR] Targeted database '${dbName}' does not contain 'test' in its name.`);
      console.error('To protect production databases from accidental schema reset, execution is blocked.');
      console.error('Specify a database containing "test" (e.g. airline_dsa_test) or set ALLOW_TEST_DB_WIPE=true.\n');
      process.exit(1);
    }
  } catch (err) {
    if (err.code === 'ERR_INVALID_URL') {
      console.error(`[CONFIG ERROR] Invalid database connection URL: ${urlStr}`);
      process.exit(1);
    }
    throw err;
  }
}

async function run() {
  console.log('============================================================');
  console.log('FlySmart Airline Reservation — PostgreSQL Database Setup');
  console.log('============================================================');
  console.log(`Target Database: ${targetUrl}`);

  assertSafeTestDatabase(targetUrl);

  const pool = new Pool({
    connectionString: targetUrl,
    connectionTimeoutMillis: 4000,
  });

  let client;
  try {
    client = await pool.connect();
    console.log('✓ Successfully connected to PostgreSQL daemon.');
  } catch (connErr) {
    console.error(`\n✖ Connection failed: ${connErr.message}`);
    console.error('\nEnsure PostgreSQL is running and listening on the specified host/port.');
    console.error('Example Docker startup command:');
    console.error('  docker run -d --name airline_postgres_staging -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=airline_dsa_test -p 5432:5432 postgres:15-alpine\n');
    await pool.end();
    process.exit(1);
  }

  try {
    const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../database/seed.sql');

    console.log(`Reading schema: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log(`Reading seed data: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('Applying relational schema (schema.sql)...');
    await client.query(schemaSql);
    console.log('✓ Tables, indexes, and constraints successfully initialized.');

    console.log('Populating seed flights, aircraft, and 80-seat matrices (seed.sql)...');
    await client.query(seedSql);
    console.log('✓ Seed data successfully populated.');

    // Verification queries
    const flightsRes = await client.query('SELECT COUNT(*) FROM flights');
    const seatsRes = await client.query('SELECT COUNT(*) FROM seats');
    const usersRes = await client.query('SELECT COUNT(*) FROM users');

    console.log('\n--- Database Verification Summary ---');
    console.log(`Users seeded:    ${usersRes.rows[0].count}`);
    console.log(`Flights seeded:  ${flightsRes.rows[0].count}`);
    console.log(`Seats generated: ${seatsRes.rows[0].count}`);
    console.log('------------------------------------');
    console.log('✓ Database setup completed successfully.\n');
  } catch (execErr) {
    console.error('✖ Error executing SQL scripts:', execErr);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
