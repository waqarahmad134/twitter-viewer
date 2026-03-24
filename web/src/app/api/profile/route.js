import { NextResponse } from "next/server";
import { fetchProfile } from "@/server/services/twitter";
import { extractUsername } from "@/utils/parsers";

export const maxDuration = 120;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get("handle");
    const username = searchParams.get("username");
    const screenName = extractUsername(handle || username);

    if (!screenName) {
      return NextResponse.json(
        {
          error: "Invalid input",
          message: "Provide a username (e.g. @elonmusk or elonmusk)",
        },
        { status: 400 }
      );
    }

    const data = await fetchProfile(screenName);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Profile fetch error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to fetch profile" },
      { status: err.statusCode || 500 }
    );
  }
}
