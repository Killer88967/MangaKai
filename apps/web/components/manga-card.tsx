import Image from "next/image";
import Link from "next/link";
import type { MangaSummary } from "@mangakai/shared";

interface MangaCardProps {
  manga: MangaSummary;
}

/**
 * Compact discovery card.
 *
 * Covers and titles do most of the work here. Detailed descriptions belong on
 * the manga page; keeping browse cards small lets substantially more series fit
 * on screen, especially on phones.
 */
export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link href={`/manga/${manga.id}`} className="group block min-w-0">
      <div className="relative aspect-2/3 overflow-hidden rounded-xl bg-surface-raised ring-1 ring-white/8 transition duration-300 group-hover:ring-brand/50">
        {manga.cover ? (
          <Image
            src={manga.cover.small}
            alt={`${manga.title} cover`}
            fill
            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 180px"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-subtle">
            Cover unavailable
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>

      <div className="pt-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-100 transition group-hover:text-white">
          {manga.title}
        </h3>

        <div className="mt-1 flex items-center gap-2 text-xs text-subtle">
          {manga.lastChapter ? (
            <span>Ch. {manga.lastChapter}</span>
          ) : (
            <span className="capitalize">{manga.status}</span>
          )}

          {manga.year && (
            <>
              <span aria-hidden="true">·</span>
              <span>{manga.year}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
