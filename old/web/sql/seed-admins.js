import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load web/.env regardless of where you run the command from.
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'twitter';

if (!DB_USER) {
  throw new Error('Missing DB_USER in environment. See web/.env.example');
}

async function main() {
  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  const passwordHash = await bcrypt.hash('password', 10);

  const users = [
    { email: 'admin@gmail.com', role: 'admin' },
    { email: 'manager@gmail.com', role: 'manager' },
  ];

  for (const u of users) {
    await pool.execute(
      `
      INSERT INTO admins (email, password_hash, role)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        role = VALUES(role),
        updated_at = CURRENT_TIMESTAMP
      `,
      [u.email, passwordHash, u.role]
    );
    console.log(`Seeded admin user: ${u.email} (${u.role})`);
  }

  await pool.end();
  console.log('Done seeding admins.');
}

main().catch((err) => {
  console.error('Seeder failed:', err?.message || err);
  process.exit(1);
});

