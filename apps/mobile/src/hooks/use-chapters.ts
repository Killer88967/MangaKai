import type { Chapter } from "@mangakai/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { getChapters } from "@/lib/api";

/** MangaDex's own cap on a feed page. */
const PAGE_SIZE = 100;

/**
 * A manga's chapter list, oldest first, paged in as the reader scrolls.
 *
 * Long series run to hundreds of chapters, so this appends pages rather than
 * trying to pull the whole feed at once.
 */
export function useChapters(mangaId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // A ref so the guard applies immediately — `onEndReached` fires repeatedly.
  const inFlight = useRef(false);

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        const page = await getChapters(
          mangaId,
          { limit: PAGE_SIZE, offset },
          signal,
        );

        if (signal?.aborted) return;

        setChapters((current) =>
          offset === 0 ? page.data : [...current, ...page.data],
        );
        setTotal(page.total);
        setError(null);
      } catch (cause: unknown) {
        if (signal?.aborted) return;

        setError(
          cause instanceof Error ? cause.message : "Unable to load chapters.",
        );
      } finally {
        inFlight.current = false;

        if (!signal?.aborted) setLoading(false);
      }
    },
    [mangaId],
  );

  useEffect(() => {
    const controller = new AbortController();

    setChapters([]);
    setLoading(true);
    void loadPage(0, controller.signal);

    return () => controller.abort();
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (inFlight.current || chapters.length === 0) return;
    if (chapters.length >= total) return;

    void loadPage(chapters.length);
  }, [chapters.length, total, loadPage]);

  return { chapters, total, error, loading, loadMore };
}
