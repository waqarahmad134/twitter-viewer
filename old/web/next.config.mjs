/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  turbopack: {
    root: __dirname,
  },

  /** HSTS in production when canonical host is configured (browser “HTTPS only” for your domain). */
  async headers() {
    if (
      process.env.NODE_ENV !== "production" ||
      !process.env.NEXT_PUBLIC_CANONICAL_HOST
    ) {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
