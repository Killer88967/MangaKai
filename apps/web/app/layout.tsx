import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { BannerBar } from "@/components/banner-bar";
import { SiteHeader } from "@/components/site-header";
import { getBanners } from "@/lib/api";
import { DISMISSED_COOKIE, parseDismissed } from "@/lib/dismissed-banners";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MangaKai — Find your next manga",
    template: "%s · MangaKai",
  },
  description: "Search MangaDex for manga to read.",
  applicationName: "MangaKai",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MangaKai",
  },
  icons: {
    icon: [
      {
        url: "/icons/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/favicon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0910",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [banners, cookieStore] = await Promise.all([
    // A banner outage must not take the whole site down with it.
    getBanners().catch(() => []),
    cookies(),
  ]);
  const dismissed = parseDismissed(cookieStore.get(DISMISSED_COOKIE)?.value);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <BannerBar
          initialBanners={banners.filter(
            (banner) => !dismissed.includes(banner.id),
          )}
          dismissedIds={dismissed}
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
