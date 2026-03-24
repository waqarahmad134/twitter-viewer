/** @type {import('next').NextConfig} */
const nextConfig = {
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
