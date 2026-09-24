import Image from "next/image";
import Link from "next/link";
import type { HomePage, MangaSummary, StaffPick } from "@mangakai/shared";
import { Hero } from "./hero";
import { MangaCard } from "./manga-card";
import { RowItem, SectionRow } from "./section-row";

function MangaShelf({
  title,
  subtitle,
  manga,
}: {
  title: string;
  subtitle?: string;
  manga: MangaSummary[];
}) {
  if (manga.length === 0) return null;

  return (
    <SectionRow title={title} subtitle={subtitle}>
      {manga.map((item) => (
        <RowItem key={item.id}>
          <MangaCard manga={item} />
        </RowItem>
      ))}
    </SectionRow>
  );
}

function StaffPickShelf({ picks }: { picks: StaffPick[] }) {
  if (picks.length === 0) return null;

  return (
    <SectionRow title="Staff Picks" subtitle="Picked by MangaKai">
      {picks.map(({ manga, note }) => (
        <RowItem key={manga.id}>
          <MangaCard manga={manga} />

          {note && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-brand-hover">
              “{note}”
            </p>
          )}
        </RowItem>
      ))}
    </SectionRow>
  );
}

/**
 * A denser update feed than the artwork-first discovery shelves.
 *
 * Fresh chapters are something readers scan rather than browse, so this keeps
 * the cover small and puts the title/chapter information first.
 */
function LatestUpdates({ manga }: { manga: MangaSummary[] }) {
  if (manga.length === 0) return null;

  return (
    <section className="mt-10 sm:mt-14">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-[-0.025em] text-white sm:text-2xl">
          Recently Updated
        </h2>

        <p className="mt-1 text-sm text-subtle">
          Fresh chapters across MangaDex
        </p>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-border bg-surface sm:grid-cols-2">
        {manga.map((item, index) => (
          <Link
            key={item.id}
            href={`/manga/${item.id}`}
            className={[
              "group flex min-w-0 items-center gap-3 p-3 transition hover:bg-surface-hover sm:p-4",
              index !== manga.length - 1 ? "border-b border-border" : "",
              index < manga.length - 2 ? "sm:border-b" : "",
              index % 2 === 0 ? "sm:border-r" : "",
            ].join(" ")}
          >
            <div className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
              {item.cover ? (
                <Image
                  src={item.cover.small}
                  alt={`${item.title} cover`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[9px] text-subtle">
                  N/A
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-zinc-100 transition group-hover:text-white">
                {item.title}
              </h3>

              <div className="mt-1.5 flex items-center gap-2 text-xs">
                {item.lastChapter ? (
                  <span className="font-medium text-brand-hover">
                    Chapter {item.lastChapter}
                  </span>
                ) : (
                  <span className="capitalize text-zinc-400">
                    {item.status}
                  </span>
                )}

                {item.year && (
                  <>
                    <span className="text-zinc-700">·</span>
                    <span className="text-subtle">{item.year}</span>
                  </>
                )}
              </div>
            </div>

            <span
              aria-hidden="true"
              className="shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** The idle homepage: what you see when you are not searching. */
export function HomeSections({ home }: { home: HomePage }) {
  return (
    <div>
      {home.hero && <Hero manga={home.hero} />}

      <StaffPickShelf picks={home.staffPicks} />

      <MangaShelf
        title="Popular"
        subtitle="Most followed on MangaDex"
        manga={home.popular}
      />

      <LatestUpdates manga={home.latestUpdates} />

      <MangaShelf
        title="Recently Added"
        subtitle="New to the catalogue"
        manga={home.recentlyAdded}
      />
    </div>
  );
}
