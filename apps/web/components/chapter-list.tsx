import type { Chapter } from "@mangakai/shared";
import Link from "next/link";
import { getChapters } from "@/lib/api";

/** "Ch. 12 — Title", degrading sensibly when either half is missing. */
function chapterLabel(chapter: Chapter): string {
  const number = chapter.number ? `Ch. ${chapter.number}` : "Oneshot";

  return chapter.title ? `${number} — ${chapter.title}` : number;
}

function ChapterMeta({ chapter }: { chapter: Chapter }) {
  const parts = [
    chapter.scanlationGroup,
    chapter.readable ? `${chapter.pages} pages` : "On the publisher’s site",
  ].filter(Boolean);

  return <span className="text-sm text-zinc-500">{parts.join(" · ")}</span>;
}

/**
 * A manga's chapters.
 *
 * Chapters MangaDex does not host — official simulpubs, mostly — link out
 * instead of opening the reader. The API decides which is which via
 * `readable`, so this only picks a destination.
 */
export async function ChapterList({
  mangaId,
  title,
}: {
  mangaId: string;
  title: string;
}) {
  const chapters = await getChapters(mangaId).catch(() => null);

  if (!chapters) {
    return (
      <p className="text-zinc-400">
        Chapters are unavailable right now. Try again shortly.
      </p>
    );
  }

  if (chapters.data.length === 0) {
    return <p className="text-zinc-400">No English chapters yet.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Showing {chapters.data.length} of {chapters.total.toLocaleString()}
      </p>

      <ul className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-white/4">
        {chapters.data.map((chapter) => {
          const label = chapterLabel(chapter);

          return (
            <li key={chapter.id}>
              {chapter.readable ? (
                <Link
                  href={`/read/${chapter.id}?manga=${mangaId}&title=${encodeURIComponent(label)}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-zinc-100">
                      {label}
                    </span>
                    <ChapterMeta chapter={chapter} />
                  </span>
                  <span aria-hidden="true" className="text-zinc-500">
                    →
                  </span>
                </Link>
              ) : (
                <a
                  href={chapter.externalUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-white/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-zinc-100">
                      {label}
                    </span>
                    <ChapterMeta chapter={chapter} />
                  </span>
                  <span aria-hidden="true" className="text-zinc-500">
                    ↗
                  </span>
                </a>
              )}
            </li>
          );
        })}
      </ul>

      <p className="sr-only">Chapters of {title}</p>
    </div>
  );
}
