"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteDownloadedChapter,
  getDownloadedChapters,
  type DownloadedChapter,
} from "@/lib/offline-chapters";

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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
          Offline
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">Downloads</h1>

        <p className="mt-2 text-sm text-zinc-400">
          Chapters saved on this device for offline reading.
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="text-zinc-300">No downloaded chapters yet.</p>

          <p className="mt-2 text-sm text-zinc-500">
            Open a chapter and tap Download to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => {
            const params = new URLSearchParams();

            if (chapter.mangaId) {
              params.set("manga", chapter.mangaId);
            }

            params.set("title", chapter.heading);

            const href = `/read/${chapter.chapterId}?${params.toString()}`;

            return (
              <div
                key={chapter.chapterId}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/3 p-4"
              >
                <Link href={href} className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-100">
                    {chapter.heading}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {chapter.pageCount} pages · downloaded{" "}
                    {new Date(chapter.downloadedAt).toLocaleDateString()}
                  </p>
                </Link>

                <button
                  type="button"
                  disabled={removing === chapter.chapterId}
                  onClick={() => void remove(chapter.chapterId)}
                  className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                >
                  {removing === chapter.chapterId ? "Removing…" : "Remove"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
