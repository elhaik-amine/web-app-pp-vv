require('dotenv').config();
const mysql = require('mysql2/promise');

const columns = [
  ['evidence_photo_url', 'VARCHAR(500) NULL'],
  ['evidence_latitude', 'DECIMAL(10,7) NULL'],
  ['evidence_longitude', 'DECIMAL(10,7) NULL'],
  ['evidence_captured_at', 'DATETIME NULL'],
  ['response_deadline', 'DATETIME NULL'],
  ['resolution_reason', 'VARCHAR(255) NULL'],
  ['resolved_at', 'DATETIME NULL'],
];

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const statusStatement =
      "ALTER TABLE reports MODIFY COLUMN status ENUM('PENDING','PENDING_REVIEW','UNDER_ADMIN_REVIEW','REVIEWED','AUTO_RESOLVED','RESOLVED','REJECTED') DEFAULT 'PENDING'";
    await connection.execute(statusStatement);
    console.log(`OK: ${statusStatement}`);

    for (const [column, definition] of columns) {
      const [existing] = await connection.execute(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reports' AND COLUMN_NAME = ?
         LIMIT 1`,
        [process.env.DB_NAME, column]
      );

      if (existing.length > 0) {
        console.log(`SKIP: reports.${column} already exists`);
        continue;
      }

      const statement = `ALTER TABLE reports ADD COLUMN ${column} ${definition}`;
      await connection.execute(statement);
      console.log(`OK: ${statement}`);
    }
  } finally {
    await connection.end();
  }
}

run()
  .then(() => {
    console.log('No-show reports migration completed.');
  })
  .catch((error) => {
    console.error('No-show reports migration failed:', error);
    process.exit(1);
  });
