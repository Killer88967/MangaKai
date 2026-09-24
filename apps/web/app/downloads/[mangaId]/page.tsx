"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteDownloadedChapter,
  deleteDownloadedManga,
  getDownloadedManga,
  type DownloadedManga,
} from "@/lib/offline-chapters";

function formatDownloadedAt(value: string): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export default function DownloadedMangaPage() {
  const params = useParams<{ mangaId: string }>();
  const router = useRouter();

  const mangaId = decodeURIComponent(params.mangaId);

  const [catalog, setCatalog] = useState<DownloadedManga | null | undefined>(
    undefined,
  );

  const [removingChapter, setRemovingChapter] = useState<string | null>(null);
  const [removingAll, setRemovingAll] = useState(false);

  function refresh() {
    setCatalog(
      getDownloadedManga().find((item) => item.mangaId === mangaId) ?? null,
    );
  }

  useEffect(() => {
    refresh();
  }, [mangaId]);

  async function removeChapter(chapterId: string) {
    setRemovingChapter(chapterId);

    try {
      await deleteDownloadedChapter(chapterId);
      refresh();
    } finally {
      setRemovingChapter(null);
    }
  }

  async function removeAll() {
    setRemovingAll(true);

    try {
      await deleteDownloadedManga(mangaId);
      router.replace("/downloads");
    } finally {
      setRemovingAll(false);
    }
  }

  if (catalog === undefined) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto size-6 animate-spin rounded-full border-2 border-white/10 border-t-brand" />

          <p className="mt-4 text-sm text-subtle">Loading downloads…</p>
        </div>
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-xl font-bold text-white">
            Downloaded series not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Its downloaded chapters may have been removed from this device.
          </p>

          <Link
            href="/downloads"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Back to downloads
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[900px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/downloads"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Downloads
        </Link>

        <header className="mt-6 flex gap-5 border-b border-border pb-7 sm:gap-6">
          <div className="relative aspect-2/3 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-raised ring-1 ring-white/8 sm:w-32">
            {catalog.cover ? (
              <Image
                src={catalog.cover}
                alt={`${catalog.title} cover`}
                fill
                priority
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-subtle">
                No cover
              </div>
            )}
          </div>

          <div className="min-w-0 self-end">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
              Offline catalog
            </p>

            <h1 className="mt-2 line-clamp-3 text-2xl font-black leading-tight tracking-[-0.035em] text-white sm:text-3xl">
              {catalog.title}
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              {catalog.chapters.length} downloaded{" "}
              {catalog.chapters.length === 1 ? "chapter" : "chapters"}
            </p>
          </div>
        </header>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-400">
              Chapters
            </h2>

            <span className="text-xs text-subtle">Available offline</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {catalog.chapters.map((chapter) => {
              const query = new URLSearchParams();

              if (chapter.mangaId) {
                query.set("manga", chapter.mangaId);
              }

              query.set("title", chapter.heading);

              if (chapter.mangaTitle) {
                query.set("series", chapter.mangaTitle);
              }

              if (chapter.mangaCover) {
                query.set("cover", chapter.mangaCover);
              }

              const readHref = `/read/${chapter.chapterId}?${query.toString()}`;

              const offlineHref = `/offline.html?chapter=${encodeURIComponent(
                chapter.chapterId,
              )}`;

              return (
                <article
                  key={chapter.chapterId}
                  className="flex items-center gap-3 border-b border-border p-4 last:border-b-0 sm:gap-4 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
                      {chapter.heading}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
                      <span>{chapter.pageCount} pages</span>

                      <span aria-hidden="true">·</span>

                      <span>{formatDownloadedAt(chapter.downloadedAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={offlineHref}
                      className="hidden rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white sm:inline-flex"
                    >
                      Offline
                    </Link>

                    <Link
                      href={readHref}
                      className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-hover transition hover:bg-brand-soft"
                    >
                      Read
                    </Link>

                    <button
                      type="button"
                      aria-label={`Remove ${chapter.heading}`}
                      disabled={removingChapter === chapter.chapterId}
                      onClick={() => void removeChapter(chapter.chapterId)}
                      className="rounded-lg px-2.5 py-2 text-sm text-zinc-500 transition hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingChapter === chapter.chapterId ? "…" : "×"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-6">
          <button
            type="button"
            disabled={removingAll}
            onClick={() => void removeAll()}
            className="rounded-xl border border-red-400/20 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {removingAll
              ? "Removing downloads…"
              : `Remove all ${catalog.chapters.length} ${
                  catalog.chapters.length === 1 ? "chapter" : "chapters"
                }`}
          </button>

          <p className="mt-3 text-xs leading-5 text-subtle">
            This removes every downloaded chapter for this series from this
            device.
          </p>
        </section>
      </div>
    </main>
  );
}
