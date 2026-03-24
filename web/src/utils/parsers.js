export function extractTweetId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (/^\d{15,25}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/status\/(\d{15,25})/i);
  return match ? match[1] : null;
}

export function extractTweetUrlParts(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)\/status\/(\d{15,25})/i
  );
  if (match) return { username: match[1].toLowerCase(), tweetId: match[2] };
  return null;
}

export function extractUsername(input) {
  if (!input || typeof input !== "string") return null;
  let trimmed = input.trim();
  if (trimmed.startsWith("@")) trimmed = trimmed.slice(1);
  const urlMatch = trimmed.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9_]{1,15}$/.test(trimmed)) return trimmed;
  return null;
}

