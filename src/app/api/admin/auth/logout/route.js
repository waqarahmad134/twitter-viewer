import { NextResponse } from "next/server";
import { getAdminIronSession } from "@/server/auth";

export async function POST() {
  const session = await getAdminIronSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
