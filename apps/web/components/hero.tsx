import Image from "next/image";
import Link from "next/link";
import type { MangaSummary } from "@mangakai/shared";

/**
 * The homepage lead story.
 *
 * Unlike the smaller catalogue cards, the hero is intentionally artwork-heavy:
 * the backdrop gives it the WEBTOON-style editorial presence while the cover,
 * metadata, and description keep the useful MangaDex-style information density.
 */
export function Hero({ manga }: { manga: MangaSummary }) {
  return (
    <section className="relative isolate min-h-[430px] overflow-hidden border-y border-border bg-surface sm:rounded-3xl sm:border">
      {manga.cover && (
        <>
          <Image
            src={manga.cover.original}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f] via-[#0d0d0f]/90 to-[#0d0d0f]/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-black/20" />
        </>
      )}

      <div className="relative mx-auto flex min-h-[430px] max-w-[1280px] items-end px-5 py-8 sm:px-8 sm:py-10 lg:items-center lg:px-12">
        <div className="grid w-full gap-6 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-end lg:grid-cols-[190px_minmax(0,680px)] lg:items-center lg:gap-9">
          <div className="relative hidden aspect-2/3 overflow-hidden rounded-2xl bg-surface-raised shadow-2xl ring-1 ring-white/10 sm:block">
            {manga.cover ? (
              <Image
                src={manga.cover.medium}
                alt={`${manga.title} cover`}
                fill
                priority
                sizes="190px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-subtle">
                Cover unavailable
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                Featured
              </span>

              <span className="rounded-full bg-black/35 px-3 py-1 text-xs capitalize text-zinc-300 backdrop-blur-md">
                {manga.status}
              </span>

              {manga.year && (
                <span className="rounded-full bg-black/35 px-3 py-1 text-xs text-zinc-300 backdrop-blur-md">
                  {manga.year}
                </span>
              )}
            </div>

            <h1 className="max-w-3xl text-3xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              {manga.title}
            </h1>

            {manga.description && (
              <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7">
                {manga.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/manga/${manga.id}`}
                className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-hover"
              >
                View series
              </Link>

              {manga.lastChapter && (
                <span className="text-sm font-medium text-zinc-300">
                  Latest: Ch. {manga.lastChapter}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
