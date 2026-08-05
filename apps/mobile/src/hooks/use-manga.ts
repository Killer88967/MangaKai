import type { Manga } from "@mangakai/shared";
import { useCallback, useEffect, useState } from "react";

import { getManga } from "@/lib/api";

/**
 * Loads one manga. Mirrors `useHomePage`, but keyed on an id, so navigating
 * from one detail screen to another refetches instead of showing stale data.
 */
export function useManga(id: string) {
  const [data, setData] = useState<Manga | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getManga(id, controller.signal)
      .then((manga) => {
        setData(manga);
        setError(null);
      })
      .catch((cause: unknown) => {
        // Aborting is this effect cleaning up after itself, not a failure.
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error ? cause.message : "Unable to load manga.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;

        setLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  return { data, error, loading, retry };
}
