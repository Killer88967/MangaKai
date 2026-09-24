"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getDownloadedChapters,
  type DownloadedChapter,
} from "@/lib/offline-chapters";

export default function OfflinePage() {
  const [chapters, setChapters] = useState<DownloadedChapter[]>([]);

  useEffect(() => {
    setChapters(getDownloadedChapters());
  }, []);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
          MangaKai
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          You&apos;re offline
        </h1>

        <p className="mt-3 text-sm text-zinc-400">
          You can still read chapters you downloaded earlier.
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8 text-center">
          <p className="text-zinc-300">No downloaded chapters.</p>

          <p className="mt-2 text-sm text-zinc-500">
            Download a chapter while you&apos;re online and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter) => (
            <Link
              key={chapter.chapterId}
              href={`/offline-reader?chapter=${encodeURIComponent(
                chapter.chapterId,
              )}`}
              className="block rounded-2xl border border-white/10 bg-white/3 p-4 transition hover:bg-white/5"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-100">
                    {chapter.heading}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {chapter.pageCount} pages
                  </p>
                </div>

                <span className="shrink-0 text-sm font-medium text-violet-300">
                  Read offline →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
