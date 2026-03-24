import { NextResponse } from "next/server";

/**
 * Production-only URL policy (when NEXT_PUBLIC_CANONICAL_HOST is set):
 * - http → https
 * - www.domain.com → https://domain.com (apex, no www)
 *
 * Skips localhost / 127.0.0.1 so dev keeps working without env.
 *
 * Set in deploy env, e.g. NEXT_PUBLIC_CANONICAL_HOST=example.com
 * (hostname only: no protocol, no path, no www)
 */

function hostnameOnly(hostHeader) {
  if (!hostHeader) return "";
  return hostHeader.split(":")[0].toLowerCase();
}

function isLocalDevHost(hostname) {
  if (!hostname) return true;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
  if (hostname.endsWith(".localhost")) return true;
  return false;
}

export function proxy(request) {
  const canonicalRaw = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim();
  if (!canonicalRaw) {
    return NextResponse.next();
  }

  const canonical = canonicalRaw.toLowerCase().replace(/^www\./, "");
  const url = request.nextUrl.clone();
  const host = hostnameOnly(request.headers.get("host"));

  if (isLocalDevHost(host)) {
    return NextResponse.next();
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttp =
    forwardedProto === "http" ||
    (forwardedProto == null && url.protocol === "http:");

  const isWww = host === `www.${canonical}`;

  if (isHttp || isWww) {
    url.hostname = canonical;
    url.protocol = "https:";
    if (url.port && url.port !== "443") {
      url.port = "";
    }
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?)$).*)",
  ],
};
