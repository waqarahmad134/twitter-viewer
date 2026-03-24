import { cache } from "react";
import { apiGetJson } from "./api";

/**
 * Active JSON-LD blocks from admin (cached per request).
 */
export const getSiteSchemas = cache(async () => {
  try {
    const data = await apiGetJson("/api/site-schemas");
    const list = Array.isArray(data?.schemas) ? data.schemas : [];
    return list.filter(
      (s) => s && s.json != null && typeof s.json === "object"
    );
  } catch {
    return [];
  }
});
