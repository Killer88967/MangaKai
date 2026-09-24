import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MangaKai",
    short_name: "MangaKai",
    description: "Find and read manga with MangaKai.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0a0910",
    theme_color: "#0a0910",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
