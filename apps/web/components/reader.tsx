"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReaderPage } from "@/components/reader-page";
import { getChapterPages } from "@/lib/api";

interface ReaderProps {
  chapterId: string;
  mangaId: string | null;
  heading: string;
}

export function Reader({ chapterId, mangaId, heading }: ReaderProps) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // One re-resolve per expiry, however many pages 403 at once.
  const resolving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    getChapterPages(chapterId, controller.signal)
      .then((chapter) => setPages(chapter.pages))
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load this chapter.",
        );
      })
      .finally(() => {
        resolving.current = false;
      });

    return () => controller.abort();
  }, [chapterId, attempt]);

  /**
   * MangaDex guarantees a page host for roughly 15 minutes and then answers
   * 403. Read a long chapter slowly and the back half dies, so an expired page
   * means "ask for a fresh host", not "this chapter is broken".
   */
  const handleExpired = useCallback(() => {
    if (resolving.current) return;

    resolving.current = true;
    setAttempt((value) => value + 1);
  }, []);

  const backHref = mangaId ? `/manga/${mangaId}` : "/";

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center">
        <h2 className="text-xl font-bold text-white">
          We couldn’t open this chapter
        </h2>
        <p className="mt-3 leading-7 text-zinc-300">{error}</p>
        <Link
          href={backHref}
          className="mt-6 inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400"
        >
          Back to the manga
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Link
          href={backHref}
          className="text-sm text-zinc-400 transition hover:text-violet-300"
        >
          <span aria-hidden="true">←</span> Back
        </Link>
        <h1 className="truncate text-sm font-semibold text-zinc-200">
          {heading}
        </h1>
      </div>

      {pages === null ? (
        <p className="text-center text-sm text-zinc-500">Loading chapter…</p>
      ) : (
        <>
          {/*
            Keyed by position, not URL: re-resolving swaps every URL, and
            keying on those would remount each page and lose the reader's place.
          */}
          {pages.map((url, index) => (
            <ReaderPage
              key={index}
              url={url}
              index={index}
              total={pages.length}
              onExpired={handleExpired}
            />
          ))}

          <p className="py-10 text-center text-sm text-zinc-500">
            End of chapter
          </p>
        </>
      )}
    </div>
  );
}
