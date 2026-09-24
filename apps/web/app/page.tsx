import Link from "next/link";
import { HomeSections } from "@/components/home-sections";
import { MangaSearch } from "@/components/manga-search";
import { getHomePage } from "@/lib/api";

function HomeError() {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
      <h2 className="text-xl font-bold text-white">
        We couldn&apos;t load the homepage
      </h2>

      <p className="mt-3 leading-7 text-zinc-300">
        The MangaKai API may be offline. Search still works if it comes back.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-hover"
      >
        Try again
      </Link>
    </div>
  );
}

export default async function Home() {
  const home = await getHomePage().catch(() => null);

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <MangaSearch>
          {home ? <HomeSections home={home} /> : <HomeError />}
        </MangaSearch>
      </div>
    </main>
  );
}
