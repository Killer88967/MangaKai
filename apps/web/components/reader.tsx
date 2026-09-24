"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ReaderPage } from "@/components/reader-page";
import { getChapterPages } from "@/lib/api";
import {
  deleteDownloadedChapter,
  downloadChapter,
  getDownloadedPageCount,
  getDownloadedPageUrls,
  isChapterDownloaded,
  saveDownloadedChapterMetadata,
} from "@/lib/offline-chapters";

interface ReaderProps {
  chapterId: string;
  mangaId: string | null;
  mangaTitle?: string;
  mangaCover?: string | null;
  heading: string;
}

/**
 * How many times a chapter will ask MangaDex for a fresh host before giving up.
 *
 * An `<img>` error carries no status code, so a genuinely broken page looks
 * exactly like an expired host. Without a ceiling the two would feed each
 * other: re-resolve, fail, re-resolve, forever.
 */
const MAX_REFRESHES = 2;

export function Reader({
  chapterId,
  mangaId,
  mangaTitle,
  mangaCover,
  heading,
}: ReaderProps) {
  const [pages, setPages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [usingOfflinePages, setUsingOfflinePages] = useState(false);

  // One re-resolve per expiry, however many pages 403 at once.
  const resolving = useRef(false);

  /**
   * A reconnect from the static offline reader can send us back with `?page=`.
   * Only restore that position once: chapter host refreshes change `pages`, and
   * repeatedly scrolling on every refresh would yank the reader backwards.
   */
  const restoredPage = useRef(false);

  async function handleDownload() {
    if (!pages || usingOfflinePages) return;

    try {
      setDownloadError(null);
      setDownloadProgress(0);

      await downloadChapter({
        chapterId,
        mangaId,
        mangaTitle,
        mangaCover,
        heading,
        pageCount: pages.length,
        onProgress: (current, total) => {
          setDownloadProgress(Math.round((current / total) * 100));
        },
      });

      setDownloaded(true);
    } catch (cause) {
      setDownloadError(
        cause instanceof Error ? cause.message : "Download failed.",
      );
    } finally {
      setDownloadProgress(null);
    }
  }

  async function handleRemoveDownload() {
    await deleteDownloadedChapter(chapterId);

    setDownloaded(false);
  }

  useEffect(() => {
    restoredPage.current = false;
  }, [chapterId]);

  useEffect(() => {
    const controller = new AbortController();
    let objectUrls: string[] = [];

    async function load() {
      setError(null);

      try {
        const chapter = await getChapterPages(chapterId, controller.signal);

        if (controller.signal.aborted) return;

        setPages(chapter.pages);

        const isDownloaded = await isChapterDownloaded(
          chapterId,
          chapter.pages.length,
        );

        setDownloaded(isDownloaded);

        /**
         * Downloads created before metadata tracking existed may already have
         * every image in Cache Storage but no entry on the Downloads page.
         * Opening one online repairs that metadata without forcing a re-download.
         */
        if (isDownloaded) {
          saveDownloadedChapterMetadata({
            chapterId,
            mangaId,
            mangaTitle,
            mangaCover,
            heading,
            pageCount: chapter.pages.length,
            downloadedAt: new Date().toISOString(),
          });
        }

        setUsingOfflinePages(false);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;

        /**
         * If the network/API is unavailable but this chapter was downloaded,
         * read the cached image blobs directly instead of failing the reader.
         */
        const cachedCount = await getDownloadedPageCount(chapterId);

        if (cachedCount > 0) {
          objectUrls = await getDownloadedPageUrls(chapterId);

          if (controller.signal.aborted) {
            objectUrls.forEach(URL.revokeObjectURL);
            return;
          }

          setPages(objectUrls);
          setDownloaded(true);
          setUsingOfflinePages(true);

          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load this chapter.",
        );
      } finally {
        resolving.current = false;
      }
    }

    void load();

    return () => {
      controller.abort();

      /**
       * Cached pages are exposed to `<img>` as temporary object URLs. Revoke
       * them when the reader unmounts so long sessions do not leak blob memory.
       */
      objectUrls.forEach(URL.revokeObjectURL);
    };
  }, [chapterId, mangaId, mangaTitle, mangaCover, heading, attempt]);

  /**
   * Restore the page the offline reader was displaying before connectivity
   * returned.
   *
   * The static offline reader sends a zero-based page index in `?page=`.
   */
  useEffect(() => {
    if (!pages || restoredPage.current) return;

    const params = new URLSearchParams(window.location.search);
    const rawPage = params.get("page");

    if (rawPage === null) {
      restoredPage.current = true;
      return;
    }

    const page = Number(rawPage);

    if (!Number.isInteger(page) || page < 0 || page >= pages.length) {
      restoredPage.current = true;
      return;
    }

    restoredPage.current = true;

    requestAnimationFrame(() => {
      document.getElementById(`reader-page-${page}`)?.scrollIntoView({
        block: "start",
      });
    });
  }, [pages]);

  /**
   * MangaDex guarantees a page host for roughly 15 minutes and then answers
   * 403. Read a long chapter slowly and the back half dies, so an expired page
   * means "ask for a fresh host", not "this chapter is broken".
   */
  const handleExpired = useCallback(() => {
    if (resolving.current) return;

    setAttempt((value) => {
      if (value >= MAX_REFRESHES) return value;

      resolving.current = true;

      return value + 1;
    });
  }, []);

  const backHref = mangaId ? `/manga/${mangaId}` : "/";

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
        <div className="w-full rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
          <h2 className="text-xl font-bold text-white">
            We couldn&apos;t open this chapter
          </h2>

          <p className="mt-3 leading-7 text-zinc-300">{error}</p>

          <Link
            href={backHref}
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-hover"
          >
            Back to the manga
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-16 z-30 border-b border-border bg-background/94 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-3 px-3 sm:px-4">
          <Link
            href={backHref}
            aria-label="Back to manga"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <span aria-hidden="true">←</span>
          </Link>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold text-zinc-200">
              {heading}
            </p>

            {pages && (
              <p className="mt-0.5 text-[11px] text-subtle">
                {pages.length} pages
              </p>
            )}
          </div>

          {pages ? (
            <button
              type="button"
              onClick={downloaded ? handleRemoveDownload : handleDownload}
              disabled={downloadProgress !== null || usingOfflinePages}
              className="flex h-9 shrink-0 items-center rounded-lg border border-border px-3 text-xs font-semibold text-zinc-300 transition hover:border-border-strong hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloadProgress !== null
                ? `${downloadProgress}%`
                : downloaded
                  ? "Downloaded"
                  : "Download"}
            </button>
          ) : (
            <div className="size-9" />
          )}
        </div>
      </header>

      {usingOfflinePages && (
        <div className="border-b border-emerald-400/15 bg-emerald-400/8 px-4 py-2 text-center text-xs font-medium text-emerald-300">
          Reading downloaded chapter
        </div>
      )}

      {downloadError && (
        <div className="border-b border-red-400/15 bg-red-400/8 px-4 py-2 text-center text-xs text-red-300">
          {downloadError}
        </div>
      )}

      {pages === null ? (
        <div className="flex min-h-[55vh] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto size-6 animate-spin rounded-full border-2 border-white/10 border-t-brand" />

            <p className="mt-4 text-sm text-subtle">Loading chapter…</p>
          </div>
        </div>
      ) : (
        <>
          {/*
            Keyed by position, not URL: re-resolving swaps every URL, and
            keying on those would remount each page and lose the reader's place.

            The wrapper also gives reconnects from the offline reader a stable
            scroll target through `?page=<index>`.
          */}
          <div className="bg-black">
            {pages.map((url, index) => (
              <div key={index} id={`reader-page-${index}`}>
                <ReaderPage
                  url={url}
                  index={index}
                  total={pages.length}
                  onExpired={handleExpired}
                />
              </div>
            ))}
          </div>

          <footer className="border-t border-border bg-background px-4 py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-subtle">
              End of chapter
            </p>

            <Link
              href={backHref}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-surface-raised px-4 text-sm font-semibold text-zinc-200 ring-1 ring-white/8 transition hover:bg-surface-hover hover:text-white"
            >
              Back to manga
            </Link>
          </footer>
        </>
      )}
    </div>
  );
}
