import { query } from "../db/mysql.js";

export async function getSingletonSiteSettingsRow() {
  const rows = await query(
    `SELECT * FROM site_settings ORDER BY updated_at DESC, id DESC LIMIT 1`
  );
  return rows[0] || null;
}

export async function dedupeSiteSettingsRows() {
  const rows = await query(
    `SELECT id FROM site_settings ORDER BY updated_at DESC, id DESC`
  );
  if (rows.length <= 1) return rows[0]?.id ?? null;
  const keepId = rows[0].id;
  await query(`DELETE FROM site_settings WHERE id <> ?`, [keepId]);
  return keepId;
}
