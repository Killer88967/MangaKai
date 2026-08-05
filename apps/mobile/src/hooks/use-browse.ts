import type { MangaCategory, MangaSummary } from "@mangakai/shared";
import { useCallback, useEffect, useRef, useState } from "react";

import { browseManga } from "@/lib/api";

const PAGE_SIZE = 30;

/**
 * An infinite listing for one category.
 *
 * Unlike the other hooks this one accumulates instead of replacing, so it holds
 * the pages loaded so far and appends the next on demand.
 */
export function useBrowse(category: MangaCategory) {
  const [items, setItems] = useState<MangaSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // A ref, not state: `onEndReached` fires repeatedly while scrolling and we
  // need the guard to be true immediately, not on the next render.
  const inFlight = useRef(false);

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        const page = await browseManga(
          category,
          { limit: PAGE_SIZE, offset },
          signal,
        );

        if (signal?.aborted) return;

        // Replace on the first page so a retry cannot duplicate rows.
        setItems((current) =>
          offset === 0 ? page.data : [...current, ...page.data],
        );
        setTotal(page.total);
        setError(null);
      } catch (cause: unknown) {
        if (signal?.aborted) return;

        setError(
          cause instanceof Error ? cause.message : "Unable to load manga.",
        );
      } finally {
        inFlight.current = false;

        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category],
  );

  useEffect(() => {
    const controller = new AbortController();

    setItems([]);
    setLoading(true);
    void loadPage(0, controller.signal);

    return () => controller.abort();
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (inFlight.current || items.length === 0 || items.length >= total) return;

    setLoadingMore(true);
    void loadPage(items.length);
  }, [items.length, total, loadPage]);

  return { items, total, error, loading, loadingMore, loadMore };
}
