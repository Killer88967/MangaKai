import type { HomePage } from "@mangakai/shared";
import { useCallback, useEffect, useState } from "react";

import { getHomePage } from "@/lib/api";

/**
 * Loads the homepage payload and exposes every state a screen has to render:
 * first load, failure, and pull-to-refresh.
 *
 * A refresh keeps the previous data on screen, so a failed refresh shows the
 * error without blanking out a page that was working a second ago.
 */
export function useHomePage() {
  const [data, setData] = useState<HomePage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getHomePage(controller.signal)
      .then((page) => {
        setData(page);
        setError(null);
      })
      .catch((cause: unknown) => {
        // Aborting is this effect cleaning up after itself, not a failure.
        if (controller.signal.aborted) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load the homepage.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;

        setLoading(false);
        setRefreshing(false);
      });

    return () => controller.abort();
  }, [attempt]);

  /** Re-runs the effect above. Safe to wire straight to a RefreshControl. */
  const refresh = useCallback(() => {
    setRefreshing(true);
    setAttempt((value) => value + 1);
  }, []);

  return { data, error, loading, refreshing, refresh };
}
