"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getDownloadedChapter,
  getDownloadedPageUrls,
} from "@/lib/offline-chapters";

export default function OfflineReaderPage() {
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [heading, setHeading] = useState("Downloaded chapter");
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("chapter");

    if (!id) {
      setError("No downloaded chapter was selected.");
      return;
    }

    setChapterId(id);

    const chapter = getDownloadedChapter(id);

    if (chapter) {
      setHeading(chapter.heading);
    }

    let objectUrls: string[] = [];

    void getDownloadedPageUrls(id)
      .then((urls) => {
        objectUrls = urls;

        if (urls.length === 0) {
          setError("This chapter is not available offline.");
          return;
        }

        setPages(urls);
      })
      .catch(() => {
        setError("Unable to open this downloaded chapter.");
      });

    return () => {
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-white">
            Unable to open chapter
          </h1>

          <p className="mt-3 text-zinc-400">{error}</p>

          <Link
            href="/offline"
            className="mt-6 inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white"
          >
            Back to downloads
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6">
      <div className="mx-auto mb-6 flex max-w-3xl items-center gap-4 px-4">
        <Link href="/offline" className="shrink-0 text-sm text-zinc-400">
          ← Downloads
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-zinc-200">
          {heading}
        </h1>

        <span className="text-xs text-emerald-400">Offline</span>
      </div>

      {pages.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          Loading downloaded chapter…
        </p>
      ) : (
        <>
          {pages.map((url, index) => (
            <div key={`${chapterId}-${index}`} className="w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Page ${index + 1} of ${pages.length}`}
                className="mx-auto block h-auto w-full max-w-3xl"
              />
            </div>
          ))}

          <p className="py-10 text-center text-sm text-zinc-500">
            End of chapter
          </p>
        </>
      )}
    </main>
  );
}
