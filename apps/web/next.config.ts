import type { NextConfig } from "next";

/**
 * Origins a Server Action may be submitted from, beyond the same origin.
 *
 * Next compares a Server Action's `Origin` header against `x-forwarded-host`
 * and rejects a mismatch, which is what stops another site POSTing to your
 * actions. A Codespace breaks that comparison honestly: its proxy sets
 * `x-forwarded-host` to the forwarded `*.app.github.dev` domain while the
 * browser, reached through VS Code's local tunnel, still sends
 * `Origin: localhost:3000`. Neither is wrong; they simply disagree.
 *
 * So we name both sides. This is empty outside a Codespace, where the check
 * already passes on its own.
 */
function codespacesServerActions(): NextConfig["experimental"] {
  const codespace = process.env.CODESPACE_NAME;

  // Outside a Codespace the check passes on its own, so stay off the
  // experimental config entirely rather than setting it to an empty list.
  if (!codespace) return undefined;

  const domain =
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev";

  return {
    serverActions: {
      allowedOrigins: [`${codespace}-3000.${domain}`, "localhost:3000"],
    },
  };
}

const nextConfig: NextConfig = {
  experimental: codespacesServerActions(),
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
