import mysql from "mysql2/promise";

/**
 * Read DB config from process.env only. Next.js merges `.env` / `.env.local` in
 * the correct order at startup — we must not call dotenv here with a different
 * order than migrate.js (which only loads `.env`), or the app and CLI disagree.
 */
function readDbConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "twitter",
    port: Number(process.env.DB_PORT || 3306),
  };
}

let poolInstance = null;

function createPool() {
  const { host, user, password, database, port } = readDbConfig();

  if (!user) {
    console.warn(
      "MySQL DB_USER is not set; blog and admin endpoints will fail until configured."
    );
  }

  return mysql.createPool({
    host,
    user,
    password,
    database,
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export function getPool() {
  if (!poolInstance) {
    poolInstance = createPool();
  }
  return poolInstance;
}

export function getDbConnectionSummary() {
  const { user, host, port, database } = readDbConfig();
  return `${user || "(no user)"}@${host}:${port}/${database}`;
}

export const pool = new Proxy(
  {},
  {
    get(_target, prop) {
      const p = getPool();
      const value = p[prop];
      if (typeof value === "function") {
        return value.bind(p);
      }
      return value;
    },
  }
);

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
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
    await getPool().query("SELECT 1");
    return { ok: true };
  } catch (err) {
    return { ok: false, err };
  }
}
