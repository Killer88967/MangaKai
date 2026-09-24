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
    chapter.readable ? `${chapter.pages} pages` : "Publisher",
  ].filter(Boolean);

  return (
    <span className="mt-1 block truncate text-xs text-subtle">
      {parts.join(" · ")}
    </span>
  );
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
  cover,
}: {
  mangaId: string;
  title: string;
  cover: string | null;
}) {
  const chapters = await getChapters(mangaId).catch(() => null);

  if (!chapters) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
        Chapters are unavailable right now. Try again shortly.
      </div>
    );
  }

  if (chapters.data.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-zinc-400">
        No English chapters yet.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm text-subtle">
          {chapters.data.length} of {chapters.total.toLocaleString()} chapters
        </p>

        <span className="text-xs text-zinc-600">English</span>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-border bg-surface">
        {chapters.data.map((chapter) => {
          const label = chapterLabel(chapter);

          const content = (
            <>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-100">
                  {label}
                </span>

                <ChapterMeta chapter={chapter} />
              </div>

              <span
                aria-hidden="true"
                className="shrink-0 text-sm text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300"
              >
                {chapter.readable ? "→" : "↗"}
              </span>
            </>
          );

          return (
            <li
              key={chapter.id}
              className="border-b border-border last:border-b-0"
            >
              {chapter.readable ? (
                <Link
                  href={{
                    pathname: `/read/${chapter.id}`,
                    query: {
                      manga: mangaId,
                      title: label,
                      series: title,
                      ...(cover ? { cover } : {}),
                    },
                  }}
                  className="group flex min-h-[72px] items-center gap-4 px-4 py-3 transition hover:bg-surface-hover sm:px-5"
                >
                  {content}
                </Link>
              ) : (
                <a
                  href={chapter.externalUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex min-h-[72px] items-center gap-4 px-4 py-3 transition hover:bg-surface-hover sm:px-5"
                >
                  {content}
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
