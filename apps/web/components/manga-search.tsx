"use client";

import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { searchManga, type MangaDexManga } from "@/lib/mangadex";
import { MangaCard } from "./manga-card";

function SearchSkeletons() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055]">
          <div className="aspect-[2/3] bg-white/10" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-4/5 rounded bg-white/10" />
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 w-2/3 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MangaSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 400);
  const [result, setResult] = useState<{
    query: string;
    manga: MangaDexManga[];
    error: string | null;
  }>({ query: "", manga: [], error: null });
  const loading = Boolean(debouncedQuery && result.query !== debouncedQuery);
  const manga = result.query === debouncedQuery ? result.manga : [];
  const error = result.query === debouncedQuery ? result.error : null;

  useEffect(() => {
    if (!debouncedQuery) return;

    const controller = new AbortController();

    searchManga(debouncedQuery, controller.signal)
      .then((response) => {
        setResult({ query: debouncedQuery, manga: response.data, error: null });
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setResult({
          query: debouncedQuery,
          manga: [],
          error: reason instanceof Error ? reason.message : "Search failed.",
        });
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">MangaKai</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Find your next story</h1>
        <p className="mt-4 text-zinc-400">Search MangaDex by title and discover something worth reading.</p>
        <label className="relative mt-8 block">
          <span className="sr-only">Search manga by title</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500">
            <circle cx="11" cy="11" r="7" strokeWidth="2" />
            <path d="m16 16 4 4" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for Solo Leveling..."
            autoComplete="off"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.07] py-4 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
          />
        </label>
      </header>

      {loading ? <SearchSkeletons /> : error ? (
        <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center text-red-200">{error}</div>
      ) : debouncedQuery && manga.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center text-zinc-400">No manga found for “{debouncedQuery}”.</div>
      ) : manga.length > 0 ? (
        <section aria-live="polite">
          <p className="mb-5 text-sm text-zinc-500">{manga.length} {manga.length === 1 ? "result" : "results"} for “{debouncedQuery}”</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {manga.map((item) => <MangaCard key={item.id} manga={item} />)}
          </div>
        </section>
      ) : (
        <div className="py-16 text-center text-sm text-zinc-600">Start typing to explore manga.</div>
      )}
    </div>
  );
}
