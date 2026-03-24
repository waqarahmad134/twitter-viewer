import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "twitter";
const DB_PORT = Number(process.env.DB_PORT || 3306);

/** For logs / health messages (no password). */
export const dbConnectionSummary = `${DB_USER || "(no user)"}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

if (!DB_USER) {
  console.warn(
    "MySQL DB_USER is not set; blog and admin endpoints will fail until configured."
  );
}

export const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export function isDatabaseConnectionError(err) {
  const code = err?.code;
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT")
    return true;
  if (code === "ENOTFOUND") return true;
  const msg = String(err?.message || "").toLowerCase();
  if (msg.includes("connect econnrefused")) return true;
  return false;
}

export async function pingDatabase() {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    return { ok: false, err };
  }
}
