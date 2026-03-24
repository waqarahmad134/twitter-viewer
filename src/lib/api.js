function serverApiOrigin() {
  const explicit =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  const port = process.env.PORT?.trim() || "3000";
  return `http://127.0.0.1:${port}`;
}

export async function apiGetJson(path) {
  const base = serverApiOrigin();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API GET ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}
