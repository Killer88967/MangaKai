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

export function Reader({ chapterId, mangaId, heading }: ReaderProps) {
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
  }, [chapterId, mangaId, heading, attempt]);

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
      <div className="mx-auto max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center">
        <h2 className="text-xl font-bold text-white">
          We couldn&apos;t open this chapter
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
    <div>
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <Link
          href={backHref}
          className="text-sm text-zinc-400 transition hover:text-violet-300"
        >
          <span aria-hidden="true">←</span> Back
        </Link>

        <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-zinc-200">
          {heading}
        </h1>

        {pages && (
          <button
            type="button"
            onClick={downloaded ? handleRemoveDownload : handleDownload}
            disabled={downloadProgress !== null || usingOfflinePages}
            className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloadProgress !== null
              ? `${downloadProgress}%`
              : downloaded
                ? "Remove"
                : "Download"}
          </button>
        )}
      </div>

      {usingOfflinePages && (
        <p className="text-center text-sm text-emerald-400">
          Reading downloaded chapter
        </p>
      )}

      {downloadError && (
        <p className="text-center text-sm text-red-400">{downloadError}</p>
      )}

      {pages === null ? (
        <p className="text-center text-sm text-zinc-500">Loading chapter…</p>
      ) : (
        <>
          {/*
            Keyed by position, not URL: re-resolving swaps every URL, and
            keying on those would remount each page and lose the reader's place.

            The wrapper also gives reconnects from the offline reader a stable
            scroll target through `?page=<index>`.
          */}
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

          <p className="py-10 text-center text-sm text-zinc-500">
            End of chapter
          </p>
        </>
      )}
    </div>
  );
}
