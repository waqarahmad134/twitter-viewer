import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionOptions } from "./sessionOptions.js";

export async function getAdminIronSession() {
  return getIronSession(await cookies(), sessionOptions);
}

export async function requireAdminSession() {
  const session = await getAdminIronSession();
  if (!session.admin?.id) {
    return {
      session,
      denied: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, denied: null };
}

export function forbidIfManager(session) {
  const role = String(session.admin?.role || "admin").toLowerCase();
  if (role === "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
