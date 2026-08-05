"use client";

import { useEffect, useRef, useState } from "react";
import { reportPageLoad } from "@/lib/api";

/**
 * How far ahead of the viewport a page starts downloading. Roughly one screen,
 * so a page is usually ready by the time it is scrolled to.
 */
const PRELOAD_MARGIN = "150% 0px";

interface ReaderPageProps {
  url: string;
  index: number;
  total: number;
  onExpired: () => void;
}

/**
 * One page of a chapter.
 *
 * Fetched with `fetch` rather than pointed at with `<img src>` because
 * MangaDex@Home needs the byte count and duration of every retrieval, and only
 * the code performing the fetch can measure those. The bytes then become an
 * object URL so the browser still decodes the image normally.
 *
 * `next/image` is deliberately not used: the host changes per chapter, and
 * optimising someone else's already-optimised page scans through our server
 * would cost bandwidth and tell us nothing about the fetch.
 */
export function ReaderPage({ url, index, total, onExpired }: ReaderPageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  const container = useRef<HTMLDivElement>(null);

  // Only start downloading once the page is near the viewport. A long chapter
  // is 90+ images and fetching them all at once would stall the connection.
  useEffect(() => {
    const element = container.current;
    if (!element || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible(true);
      },
      { rootMargin: PRELOAD_MARGIN },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const controller = new AbortController();
    let created: string | null = null;

    async function load() {
      const started = performance.now();

      try {
        const response = await fetch(url, { signal: controller.signal });
        const blob = await response.blob();
        const duration = Math.round(performance.now() - started);

        // MangaDex currently echoes the request Origin into
        // `Access-Control-Expose-Headers` instead of naming headers, so
        // `X-Cache` is not readable cross-origin and this is usually false.
        const cached = (response.headers.get("X-Cache") ?? "").startsWith(
          "HIT",
        );

        reportPageLoad({
          url,
          success: response.ok,
          cached,
          bytes: blob.size,
          duration,
        });

        if (!response.ok) {
          // 403 means the 15 minute host guarantee ran out mid-chapter.
          if (response.status === 403) onExpired();
          setFailed(true);
          return;
        }

        created = URL.createObjectURL(blob);
        setObjectUrl(created);
      } catch {
        if (controller.signal.aborted) return;

        reportPageLoad({
          url,
          success: false,
          cached: false,
          bytes: 0,
          duration: Math.round(performance.now() - started),
        });
        setFailed(true);
      }
    }

    void load();

    return () => {
      controller.abort();
      // Without this a long chapter leaks every page it ever decoded.
      if (created) URL.revokeObjectURL(created);
    };
  }, [url, visible, onExpired]);

  return (
    <div ref={container} className="min-h-40 w-full">
      {objectUrl ? (
        // An object URL of bytes we fetched ourselves. next/image cannot take
        // one, and routing these through the optimiser would cost bandwidth
        // while telling us nothing about the retrieval we have to report on.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={objectUrl}
          alt={`Page ${index + 1} of ${total}`}
          className="mx-auto block h-auto w-full max-w-3xl"
        />
      ) : (
        <div className="mx-auto flex aspect-2/3 w-full max-w-3xl items-center justify-center bg-white/4 text-sm text-zinc-500">
          {failed ? "Page failed to load" : `Page ${index + 1}`}
        </div>
      )}
    </div>
  );
}
