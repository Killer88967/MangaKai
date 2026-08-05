import Image from "next/image";
import Link from "next/link";
import { coverUrl, localizedText, type MangaDexManga } from "@/lib/mangadex";

interface MangaCardProps {
  manga: MangaDexManga;
}

export function MangaCard({ manga }: MangaCardProps) {
  const cover = coverUrl(manga);
  const title = localizedText(manga.attributes.title) || "Untitled";
  const description =
    localizedText(manga.attributes.description) || "No description available.";

  return (
    <Link
      href={`/manga/${manga.id}`}
      className="block group overflow-hidden rounded-2xl border border-white/10 bg-white/5.5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:bg-white/8"
    >
      <div className="relative aspect-2/3 overflow-hidden bg-zinc-900">
        {cover ? (
          <Image
            src={cover}
            alt={`${title} cover`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500">
            Cover unavailable
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <h2 className="line-clamp-2 min-h-12 font-semibold leading-6 text-zinc-100">
          {title}
        </h2>
        <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-violet-400/10 px-2.5 py-1 capitalize text-violet-300">
            {manga.attributes.status}
          </span>
          {manga.attributes.lastChapter && (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">
              Chapter {manga.attributes.lastChapter}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
