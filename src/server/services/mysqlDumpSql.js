import mysql from "mysql2";
import { pool } from "../db/mysql.js";

const DB_NAME = process.env.DB_NAME || "twitter";

function assertSafeIdentifier(name) {
  if (!/^[a-zA-Z0-9_]+$/.test(String(name))) {
    throw new Error(`Unsafe table name: ${name}`);
  }
  return String(name);
}

function quoteIdent(name) {
  return `\`${String(name).replace(/`/g, "``")}\``;
}

function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "bigint") return mysql.escape(val.toString());
  if (Buffer.isBuffer(val)) return mysql.escape(val);
  if (typeof val === "object" && !(val instanceof Date)) {
    return mysql.escape(JSON.stringify(val));
  }
  return mysql.escape(val);
}

export async function generateMysqlDumpSql() {
  const header = [
    "-- MySQL dump (Twitter Viewer admin backup)",
    `-- Generated: ${new Date().toISOString()}`,
    `-- Database: ${DB_NAME}`,
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS=0;",
    "SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';",
    "",
  ].join("\n");

  const [tables] = await pool.query(
    `SELECT TABLE_NAME AS name, TABLE_TYPE AS type
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
       AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
     ORDER BY TABLE_NAME`,
    [DB_NAME]
  );

  const baseTables = [];
  const views = [];
  for (const t of tables) {
    const n = t.name;
    if (t.type === "BASE TABLE") baseTables.push(n);
    else if (t.type === "VIEW") views.push(n);
  }

  const lines = [header];

  lines.push("-- Drop views (before tables)");
  for (let i = views.length - 1; i >= 0; i -= 1) {
    const n = assertSafeIdentifier(views[i]);
    lines.push(`DROP VIEW IF EXISTS \`${n}\`;`);
  }
  lines.push("-- Drop tables");
  for (let i = baseTables.length - 1; i >= 0; i -= 1) {
    const n = assertSafeIdentifier(baseTables[i]);
    lines.push(`DROP TABLE IF EXISTS \`${n}\`;`);
  }
  lines.push("");

  for (const rawName of baseTables) {
    const name = assertSafeIdentifier(rawName);
    const [createRows] = await pool.query(`SHOW CREATE TABLE \`${name}\``);
    const row = createRows[0];
    const createSql = row["Create Table"];
    lines.push(`-- Table structure for \`${name}\``);
    lines.push(`DROP TABLE IF EXISTS \`${name}\`;`);
    lines.push(`${createSql};`);
    lines.push("");
  }

  for (const rawName of baseTables) {
    const name = assertSafeIdentifier(rawName);
    const [cols] = await pool.query(`SHOW COLUMNS FROM \`${name}\``);
    const colNames = cols.map((c) => c.Field);
    if (colNames.length === 0) continue;

    const [rows] = await pool.query(`SELECT * FROM \`${name}\``);
    if (!rows.length) continue;

    lines.push(`-- Data for table \`${name}\``);
    const batchSize = 100;
    const colsQuoted = colNames.map((c) => quoteIdent(c)).join(",");

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const valuesSql = batch
        .map((row) => {
          const inner = colNames.map((c) => escapeSqlValue(row[c])).join(",");
          return `(${inner})`;
        })
        .join(",");
      lines.push(`INSERT INTO \`${name}\` (${colsQuoted}) VALUES ${valuesSql};`);
    }
    lines.push("");
  }

  for (const rawName of views) {
    const name = assertSafeIdentifier(rawName);
    const [createRows] = await pool.query(`SHOW CREATE VIEW \`${name}\``);
    const row = createRows[0];
    const createSql = row["Create View"];
    lines.push(`-- View structure for \`${name}\``);
    lines.push(`DROP VIEW IF EXISTS \`${name}\`;`);
    lines.push(`${createSql};`);
    lines.push("");
  }

  lines.push("SET FOREIGN_KEY_CHECKS=1;");
  return lines.join("\n");
}
