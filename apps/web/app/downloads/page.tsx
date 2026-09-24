"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteDownloadedChapter,
  getDownloadedChapters,
  type DownloadedChapter,
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

export default function DownloadsPage() {
  const [chapters, setChapters] = useState<DownloadedChapter[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    setChapters(getDownloadedChapters());
  }, []);

  async function remove(chapterId: string) {
    setRemoving(chapterId);

    try {
      await deleteDownloadedChapter(chapterId);

      setChapters((current) =>
        current.filter((chapter) => chapter.chapterId !== chapterId),
      );
    } finally {
      setRemoving(null);
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-8 border-b border-border pb-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
                Offline library
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Downloads
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Chapters saved on this device stay available when MangaKai
                can&apos;t reach the network.
              </p>
            </div>

            {chapters.length > 0 && (
              <div className="rounded-xl bg-surface px-4 py-3 ring-1 ring-white/8">
                <p className="text-xs uppercase tracking-[0.12em] text-subtle">
                  Saved
                </p>

                <p className="mt-0.5 text-lg font-bold text-white">
                  {chapters.length}{" "}
                  <span className="text-sm font-normal text-zinc-500">
                    {chapters.length === 1 ? "chapter" : "chapters"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </header>

        {chapters.length === 0 ? (
          <section className="flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-xl text-brand-hover">
                ↓
              </div>

              <h2 className="mt-5 text-lg font-bold text-white">
                Nothing downloaded yet
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Open a chapter and choose Download to keep it available without
                an internet connection.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Browse manga
              </Link>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-400">
                On this device
              </h2>

              <span className="text-xs text-subtle">Stored locally</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {chapters.map((chapter) => {
                const params = new URLSearchParams();

                if (chapter.mangaId) {
                  params.set("manga", chapter.mangaId);
                }

                params.set("title", chapter.heading);

                const href = `/read/${chapter.chapterId}?${params.toString()}`;
                const offlineHref = `/offline.html?chapter=${encodeURIComponent(
                  chapter.chapterId,
                )}`;

                return (
                  <article
                    key={chapter.chapterId}
                    className="group flex items-center gap-4 border-b border-border p-4 last:border-b-0 sm:p-5"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-sm font-bold text-brand-hover">
                      ↓
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link href={href} className="block">
                        <h3 className="truncate text-sm font-semibold text-zinc-100 transition group-hover:text-white sm:text-base">
                          {chapter.heading}
                        </h3>
                      </Link>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-subtle">
                        <span>{chapter.pageCount} pages</span>

                        <span aria-hidden="true">·</span>

                        <span>
                          Downloaded {formatDownloadedAt(chapter.downloadedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={offlineHref}
                        className="hidden rounded-lg px-3 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white sm:block"
                      >
                        Offline
                      </Link>

                      <Link
                        href={href}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-hover transition hover:bg-brand-soft"
                      >
                        Read
                      </Link>

                      <button
                        type="button"
                        disabled={removing === chapter.chapterId}
                        onClick={() => void remove(chapter.chapterId)}
                        className="rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {removing === chapter.chapterId ? "…" : "Remove"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="mt-4 text-xs leading-5 text-subtle">
              Downloads are stored only on this device and browser. Removing
              site data will also remove downloaded chapters.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
