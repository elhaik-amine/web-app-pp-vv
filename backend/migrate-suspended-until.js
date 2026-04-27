/**
 * migrate-suspended-until.js
 * Run ONCE: node migrate-suspended-until.js
 * Adds suspended_until column to users table.
 */
require('dotenv').config({ path: './.env' });
const { pool } = require('./src/config/db');

async function main() {
  // Check if column already exists before adding
  const [cols] = await pool.execute(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'suspended_until'
  `);
  if (cols.length === 0) {
    await pool.execute(`ALTER TABLE users ADD COLUMN suspended_until DATETIME NULL DEFAULT NULL`);
    console.log('✅ Column suspended_until added to users table.');
  } else {
    console.log('ℹ️  Column suspended_until already exists — skipping.');
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
