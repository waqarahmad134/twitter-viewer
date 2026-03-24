import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
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

// If you add new columns later, update this object.
// Migrate will only ADD missing columns (it will not modify existing ones).
const desiredColumns = {
  categories: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    name: 'VARCHAR(255) NOT NULL',
    slug: 'VARCHAR(191) NOT NULL UNIQUE',
    description: 'TEXT NULL',
    seo_title: 'VARCHAR(255) NULL',
    seo_description: 'TEXT NULL',
    og_image_url: 'VARCHAR(1024) NULL',
    noindex: 'TINYINT(1) NOT NULL DEFAULT 0',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
  posts: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    slug: 'VARCHAR(191) NOT NULL UNIQUE',
    title: 'VARCHAR(255) NOT NULL',
    excerpt: 'TEXT NULL',
    content_md: 'MEDIUMTEXT NULL',
    content_html: 'LONGTEXT NULL',
    cover_image_url: 'VARCHAR(1024) NULL',
    status: "ENUM('draft','published') NOT NULL DEFAULT 'draft'",
    category_id: 'INT NULL',
    published_at: 'DATETIME NULL',
    seo_title: 'VARCHAR(255) NULL',
    seo_description: 'TEXT NULL',
    og_image_url: 'VARCHAR(1024) NULL',
    noindex: 'TINYINT(1) NOT NULL DEFAULT 0',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
  admins: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    email: 'VARCHAR(191) NOT NULL UNIQUE',
    password_hash: 'VARCHAR(255) NOT NULL',
    role: "VARCHAR(50) NOT NULL DEFAULT 'admin'",
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
  site_settings: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    site_name: "VARCHAR(255) NOT NULL DEFAULT 'Twitter Viewer'",
    default_description: 'TEXT NULL',
    default_og_image_url: 'VARCHAR(1024) NULL',
    default_og_title: 'VARCHAR(255) NULL',
    default_canonical_base: 'VARCHAR(1024) NULL',
    default_noindex: 'TINYINT(1) NOT NULL DEFAULT 0',
    default_twitter_card: 'VARCHAR(50) NULL',
    default_twitter_site: 'VARCHAR(100) NULL',
    default_twitter_creator: 'VARCHAR(100) NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
  media: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    file_url: 'VARCHAR(1024) NOT NULL',
    file_name: 'VARCHAR(255) NULL',
    mime_type: 'VARCHAR(255) NULL',
    file_size: 'BIGINT NULL',
    title: 'VARCHAR(255) NULL',
    alt_text: 'VARCHAR(255) NULL',
    caption: 'TEXT NULL',
    description: 'TEXT NULL',
    status: "ENUM('active','deleted') NOT NULL DEFAULT 'active'",
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
  site_schemas: {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    name: "VARCHAR(255) NOT NULL DEFAULT 'Schema'",
    schema_json: 'LONGTEXT NOT NULL',
    is_active: 'TINYINT(1) NOT NULL DEFAULT 1',
    sort_order: 'INT NOT NULL DEFAULT 0',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  },
};

async function runSchemaSql(pool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSqlRaw = fs.readFileSync(schemaPath, 'utf8');

  // Remove line comments and block comments so the naive `split(';')` won't
  // accidentally create "comment chunks" that get skipped.
  const schemaSql = schemaSqlRaw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // Very simple statement splitter: schema.sql contains only CREATE TABLE ... statements.
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await pool.query(stmt);
  }
}

async function getExistingColumns(pool, tableName) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set(rows.map((r) => r.Field));
}

async function addMissingColumns(pool, tableName) {
  const existing = await getExistingColumns(pool, tableName);
  const cols = desiredColumns[tableName] || {};

  for (const [colName, colDef] of Object.entries(cols)) {
    if (existing.has(colName)) continue;
    const sql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${colName}\` ${colDef}`;
    console.log(`[migrate] Adding column ${tableName}.${colName}`);
    await pool.query(sql);
  }
}

/** Removed from app; drop on existing DBs (safe no-op if already gone). */
async function dropLegacySiteSettingsColumns(pool) {
  let existing;
  try {
    existing = await getExistingColumns(pool, 'site_settings');
  } catch {
    return;
  }
  for (const col of ['default_robots', 'default_title']) {
    if (!existing.has(col)) continue;
    await pool.query(`ALTER TABLE \`site_settings\` DROP COLUMN \`${col}\``);
    console.log(`[migrate] Dropped site_settings.${col}`);
  }
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

  await runSchemaSql(pool);

  for (const tableName of Object.keys(desiredColumns)) {
    console.log(`[migrate] Ensuring columns for ${tableName}`);
    await addMissingColumns(pool, tableName);
  }

  await dropLegacySiteSettingsColumns(pool);

  await pool.end();
  console.log('[migrate] Done');
}

main().catch((err) => {
  console.error('[migrate] Failed:', err?.message || err);
  process.exit(1);
});

