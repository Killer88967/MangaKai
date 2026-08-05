import type { Metadata } from "next";
import { cookies } from "next/headers";
import { BannerBar } from "@/components/banner-bar";
import { getBanners } from "@/lib/api";
import { DISMISSED_COOKIE, parseDismissed } from "@/lib/dismissed-banners";
import "./globals.css";

export const metadata: Metadata = {
  title: "MangaKai — Find your next manga",
  description: "Search MangaDex for manga to read.",
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
        {children}
      </body>
    </html>
  );
}
