"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getDownloadedManga,
  type DownloadedManga,
} from "@/lib/offline-chapters";

export default function DownloadsPage() {
  const [catalogs, setCatalogs] = useState<DownloadedManga[]>([]);

  useEffect(() => {
    setCatalogs(getDownloadedManga());
  }, []);

  const chapterCount = useMemo(
    () =>
      catalogs.reduce((total, catalog) => total + catalog.chapters.length, 0),
    [catalogs],
  );

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-8 border-b border-border pb-7">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
                Offline library
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Downloads
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                Your downloaded manga, grouped by series and ready to read
                without downloading the same library all over again.
              </p>
            </div>

            {catalogs.length > 0 && (
              <div className="flex gap-5 rounded-xl bg-surface px-4 py-3 ring-1 ring-white/8">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-subtle">
                    Series
                  </p>

                  <p className="mt-0.5 text-lg font-bold text-white">
                    {catalogs.length}
                  </p>
                </div>

                <div className="w-px bg-border" />

                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-subtle">
                    Chapters
                  </p>

                  <p className="mt-0.5 text-lg font-bold text-white">
                    {chapterCount}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {catalogs.length === 0 ? (
          <section className="flex min-h-[340px] items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface/50 px-6 text-center">
            <div className="max-w-sm">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-xl text-brand-hover">
                ↓
              </div>

              <h2 className="mt-5 text-lg font-bold text-white">
                Nothing downloaded yet
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Download chapters while reading and their series will appear
                here automatically.
              </p>

              <Link
                href="/"
                className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Browse manga
              </Link>
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-400">
                Downloaded series
              </h2>

              <span className="text-xs text-subtle">Stored on this device</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {catalogs.map((catalog) => {
                const latest = catalog.chapters[0];

                return (
                  <Link
                    key={catalog.mangaId}
                    href={`/downloads/${encodeURIComponent(catalog.mangaId)}`}
                    className="group flex min-w-0 gap-4 rounded-2xl border border-border bg-surface p-3 transition hover:border-border-strong hover:bg-surface-hover sm:p-4"
                  >
                    <div className="relative aspect-2/3 w-[76px] shrink-0 overflow-hidden rounded-xl bg-surface-raised sm:w-[88px]">
                      {catalog.cover ? (
                        <Image
                          src={catalog.cover}
                          alt={`${catalog.title} cover`}
                          fill
                          sizes="88px"
                          className="object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-subtle">
                          No cover
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col py-1">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 font-semibold leading-5 text-zinc-100 transition group-hover:text-white">
                          {catalog.title}
                        </h3>

                        <p className="mt-1.5 text-sm font-medium text-brand-hover">
                          {catalog.chapters.length}{" "}
                          {catalog.chapters.length === 1
                            ? "chapter"
                            : "chapters"}{" "}
                          downloaded
                        </p>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.1em] text-subtle">
                            Latest download
                          </p>

                          <p className="mt-1 truncate text-xs text-zinc-400">
                            {latest?.heading ?? "Unknown chapter"}
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className="shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300"
                        >
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="mt-5 text-xs leading-5 text-subtle">
              Downloads are stored only on this device and browser. Removing
              site data will also remove downloaded chapters.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
