import { NextResponse } from "next/server";
import { fetchTweet } from "@/server/services/twitter";
import { extractTweetUrlParts } from "@/utils/parsers";

export const maxDuration = 120;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const username = searchParams.get("username");
    const id = searchParams.get("id");
    let parts = null;

    if (url) {
      parts = extractTweetUrlParts(url);
    } else if (username && id) {
      parts = { username: username.replace(/^@/, ""), tweetId: id };
    }

    if (!parts) {
      return NextResponse.json(
        {
          error: "Invalid input",
          message:
            "Provide a tweet URL (e.g. https://x.com/username/status/1234567890) or username + id",
        },
        { status: 400 }
      );
    }

    const data = await fetchTweet(parts.username, parts.tweetId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Tweet fetch error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to fetch tweet" },
      { status: err.statusCode || 500 }
    );
  }
}
