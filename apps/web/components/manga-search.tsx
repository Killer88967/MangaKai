"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { MangaSummary } from "@mangakai/shared";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { searchManga } from "@/lib/api";
import { MangaCard } from "./manga-card";

const MIN_QUERY_LENGTH = 3;

function SearchSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-2/3 rounded-xl bg-white/8" />
          <div className="mt-2.5 h-4 w-4/5 rounded bg-white/8" />
          <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

interface MangaSearchProps {
  /** Shown while there is no active search — the homepage rows live here. */
  children?: ReactNode;
}

export function MangaSearch({ children }: MangaSearchProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 400);

  const [result, setResult] = useState<{
    query: string;
    manga: MangaSummary[];
    error: string | null;
  }>({
    query: "",
    manga: [],
    error: null,
  });

  // Too-short queries are treated as no query at all, so the derived values
  // below fall back to the idle state without the effect resetting anything.
  const activeQuery =
    debouncedQuery.length >= MIN_QUERY_LENGTH ? debouncedQuery : "";

  const loading = Boolean(activeQuery && result.query !== activeQuery);
  const manga = result.query === activeQuery ? result.manga : [];
  const error = result.query === activeQuery ? result.error : null;

  useEffect(() => {
    if (!activeQuery) return;

    const controller = new AbortController();

    searchManga(activeQuery, controller.signal)
      .then((response) => {
        setResult({
          query: activeQuery,
          manga: response.data,
          error: null,
        });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }

        setResult({
          query: activeQuery,
          manga: [],
          error: reason instanceof Error ? reason.message : "Search failed.",
        });
      });

    return () => controller.abort();
  }, [activeQuery]);

  return (
    <div>
      <div id="search" className="mb-5 flex scroll-mt-24 items-center gap-3">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search manga by title</span>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500"
          >
            <circle cx="11" cy="11" r="7" strokeWidth="2" />

            <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
          </svg>

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search manga..."
            autoComplete="off"
            className="h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 hover:border-border-strong focus:border-brand/60 focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </div>

      {loading ? (
        <div className="py-5">
          <SearchSkeletons />
        </div>
      ) : error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center text-red-200"
        >
          {error}
        </div>
      ) : activeQuery && manga.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center text-zinc-400">
          No manga found for “{activeQuery}”.
        </div>
      ) : manga.length > 0 ? (
        <section aria-live="polite" className="py-5">
          <div className="mb-5">
            <h1 className="text-2xl font-bold tracking-[-0.025em] text-white">
              Search results
            </h1>

            <p className="mt-1 text-sm text-subtle">
              {manga.length} {manga.length === 1 ? "result" : "results"} for “
              {activeQuery}”
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 xl:grid-cols-6">
            {manga.map((item) => (
              <MangaCard key={item.id} manga={item} />
            ))}
          </div>
        </section>
      ) : (
        (children ?? (
          <div className="py-16 text-center text-sm text-subtle">
            Start typing to explore manga.
          </div>
        ))
      )}
    </div>
  );
}
