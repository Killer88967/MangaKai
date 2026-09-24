import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ChapterList } from "@/components/chapter-list";
import { getManga } from "@/lib/api";

function ChapterListSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="flex h-[74px] animate-pulse items-center gap-4 border-b border-border px-4 last:border-b-0"
        >
          <div className="h-4 w-24 rounded bg-white/8" />
          <div className="h-3 w-40 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

interface MangaPageProps {
  params: Promise<{ id: string }>;
}

const metadataLabels = {
  status: "Status",
  year: "Year",
  rating: "Content rating",
} as const;

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function AlternativeTitles({ titles }: { titles: string[] }) {
  if (titles.length === 0) return null;

  const titleList = (
    <p className="text-sm leading-6 text-zinc-400">{titles.join(" · ")}</p>
  );

  return titles.length > 3 ? (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm text-zinc-400 transition hover:text-brand-hover">
        <span className="group-open:hidden">
          Show {titles.length} alternative titles
        </span>

        <span className="hidden group-open:inline">
          Hide alternative titles
        </span>
      </summary>

      <div className="mt-2">{titleList}</div>
    </details>
  ) : (
    titleList
  );
}

function PeopleList({ label, names }: { label: string; names: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-subtle">
        {label}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-200">
        {names.join(", ") || "Unknown"}
      </p>
    </div>
  );
}

function LoadError() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-red-400/20 bg-red-400/10 p-8 text-center">
        <h1 className="text-2xl font-bold text-white">
          We couldn&apos;t load this manga
        </h1>

        <p className="mt-3 leading-7 text-zinc-300">
          It may be unavailable, or MangaDex may be having a temporary issue.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-hover"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}

export default async function MangaPage({ params }: MangaPageProps) {
  const { id } = await params;
  const manga = await getManga(id).catch(() => null);

  if (!manga) return <LoadError />;

  const description = manga.description || "No description available.";

  const metadata = {
    status: formatLabel(manga.status),
    year: manga.year?.toString() ?? "Unknown",
    rating: manga.contentRating ? formatLabel(manga.contentRating) : "Unknown",
  };

  return (
    <main className="flex-1">
      <article>
        <section className="relative isolate overflow-hidden border-b border-border bg-surface">
          {manga.cover && (
            <>
              <Image
                src={manga.cover.original}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center opacity-35 blur-sm scale-105"
              />

              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/25" />
            </>
          )}

          <div className="relative mx-auto w-full max-w-[1280px] px-4 pb-8 pt-6 sm:px-6 sm:pb-10 lg:px-8">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <span aria-hidden="true">←</span>
              Back
            </Link>

            <div className="grid gap-6 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-end lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
              <div className="relative mx-auto aspect-2/3 w-40 overflow-hidden rounded-2xl bg-surface-raised shadow-2xl ring-1 ring-white/10 sm:mx-0 sm:w-full">
                {manga.cover ? (
                  <Image
                    src={manga.cover.medium}
                    alt={`${manga.title} cover`}
                    fill
                    priority
                    sizes="(max-width: 639px) 160px, 230px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-subtle">
                    Cover unavailable
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
                  Manga
                </p>

                <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                  {manga.title}
                </h1>

                <div className="mt-3 max-w-3xl">
                  <AlternativeTitles titles={manga.altTitles} />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {Object.entries(metadata).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-zinc-300 backdrop-blur"
                    >
                      <span className="text-zinc-500">
                        {metadataLabels[key as keyof typeof metadataLabels]}:
                      </span>{" "}
                      <span className="capitalize">{value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-10">
          <div className="min-w-0 space-y-10">
            <section>
              <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
                About
              </h2>

              <p className="mt-4 whitespace-pre-line leading-7 text-zinc-300">
                {description}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold tracking-[-0.02em] text-white">
                Chapters
              </h2>

              <div className="mt-4">
                {/*
                  Streamed in its own Suspense boundary: the chapter feed is a
                  second MangaDex round trip, and the details above should not
                  wait on it.
                */}
                <Suspense fallback={<ChapterListSkeleton />}>
                  <ChapterList mangaId={manga.id} title={manga.title} />
                </Suspense>
              </div>
            </section>
          </div>

          <aside className="space-y-7 lg:sticky lg:top-24 lg:self-start">
            <section>
              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-subtle">
                Genres & tags
              </h2>

              <div className="mt-3 flex flex-wrap gap-2">
                {manga.tags.length > 0 ? (
                  manga.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-lg bg-surface-raised px-2.5 py-1.5 text-xs text-zinc-300 ring-1 ring-white/8"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No tags available.</p>
                )}
              </div>
            </section>

            <section className="grid gap-6 border-t border-border pt-6">
              <PeopleList label="Authors" names={manga.authors} />
              <PeopleList label="Artists" names={manga.artists} />
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
