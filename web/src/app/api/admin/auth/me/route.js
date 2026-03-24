import { NextResponse } from "next/server";
import { requireAdminSession } from "@/server/auth";

export async function GET() {
  const { session, denied } = await requireAdminSession();
  if (denied) return denied;
  return NextResponse.json({ admin: session.admin });
}
