import Link from "next/link";
import { BannerPopup } from "@/components/banner-popup";
import { HomeSections } from "@/components/home-sections";
import { MangaSearch } from "@/components/manga-search";
import { getHomePage } from "@/lib/api";

function HomeError() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center">
      <h2 className="text-xl font-bold text-white">
        We couldn’t load the homepage
      </h2>
      <p className="mt-3 leading-7 text-zinc-300">
        The MangaKai API may be offline. Search still works if it comes back.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400"
      >
        Try again
      </Link>
    </div>
  );
}

export default async function Home() {
  const home = await getHomePage().catch(() => null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#251447_0%,#0a0910_38%)] px-4 py-12 sm:px-6 lg:px-8">
      {home && <BannerPopup initialBanners={home.banners} />}
      <MangaSearch>
        {home ? <HomeSections home={home} /> : <HomeError />}
      </MangaSearch>
    </main>
  );
}
