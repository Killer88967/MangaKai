import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript rather than a build step.
  transpilePackages: ["@mangakai/shared"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "uploads.mangadex.org" }],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL ?? "http://localhost:8787"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
