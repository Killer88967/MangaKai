import Image from "next/image";
import Link from "next/link";
import type { MangaSummary } from "@mangakai/shared";

export function Hero({ manga }: { manga: MangaSummary }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5.5">
      {manga.cover && (
        <>
          <Image
            src={manga.cover.original}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent" />
        </>
      )}

      <div className="relative grid gap-6 p-6 sm:p-9 md:grid-cols-[180px_1fr] md:items-center">
        <div className="relative mx-auto aspect-2/3 w-36 overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl md:mx-0 md:w-full">
          {manga.cover ? (
            <Image
              src={manga.cover.medium}
              alt={`${manga.title} cover`}
              fill
              priority
              sizes="180px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              No cover
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-400">
            Featured
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
            {manga.title}
          </h2>
          {manga.description && (
            <p className="mt-3 line-clamp-3 max-w-2xl leading-7 text-zinc-300">
              {manga.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={`/manga/${manga.id}`}
              className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              View details
            </Link>
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs capitalize text-zinc-300">
              {manga.status}
            </span>
            {manga.year && (
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                {manga.year}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
