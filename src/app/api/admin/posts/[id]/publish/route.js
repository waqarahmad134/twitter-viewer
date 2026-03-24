import { NextResponse } from "next/server";
import { forbidIfManager, requireAdminSession } from "@/server/auth";
import { query } from "@/server/db/mysql";
import { toIntOrNull } from "@/server/logic/adminPostUtils";

export async function POST(_request, context) {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  const fm = forbidIfManager(session);
  if (fm) return fm;

  const params = await context.params;
  try {
    const id = toIntOrNull(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    await query(`UPDATE posts SET status='published', published_at=NOW() WHERE id = ?`, [
      id,
    ]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin publish post error:", err.message);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
