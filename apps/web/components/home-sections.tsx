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
    <SectionRow title="Staff Picks" subtitle="Chosen by the MangaKai team">
      {picks.map(({ manga, note }) => (
        <RowItem key={manga.id}>
          <MangaCard manga={manga} />
          {note && (
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-violet-300/80">
              “{note}”
            </p>
          )}
        </RowItem>
      ))}
    </SectionRow>
  );
}

/** The idle homepage: what you see when you are not searching. */
export function HomeSections({ home }: { home: HomePage }) {
  return (
    <div className="mt-4">
      {home.hero && <Hero manga={home.hero} />}
      <StaffPickShelf picks={home.staffPicks} />
      <MangaShelf
        title="Popular"
        subtitle="Most followed on MangaDex"
        manga={home.popular}
      />
      <MangaShelf
        title="Recently Updated"
        subtitle="Fresh chapters"
        manga={home.latestUpdates}
      />
      <MangaShelf
        title="Recently Added"
        subtitle="New to the catalogue"
        manga={home.recentlyAdded}
      />
    </div>
  );
}
