import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship raw TypeScript rather than a build step.
  transpilePackages: ["@mangakai/shared"],
  /**
   * Required for the banner SSE stream.
   *
   * Next gzips proxied responses, and compressing an event stream buffers it:
   * the browser's EventSource connects and sits at readyState 1 forever without
   * receiving a single frame. curl hides this, because it sends no
   * `Accept-Encoding` by default and so gets an uncompressed stream.
   *
   * `Cache-Control: no-transform` and `Content-Encoding: identity` from the API
   * are *not* enough — Next compresses regardless. Compression belongs on the
   * CDN or reverse proxy in front of this app anyway.
   */
  compress: false,
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
