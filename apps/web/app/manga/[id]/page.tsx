import Image from "next/image";
import Link from "next/link";
import {
  coverUrl,
  getManga,
  localizedText,
  relationshipNames,
  type MangaDexManga,
} from "@/lib/mangadex";

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

function AlternativeTitles({ manga }: { manga: MangaDexManga }) {
  const titles = (manga.attributes.altTitles ?? [])
    .flatMap((title) => Object.values(title))
    .filter((title, index, all) => all.indexOf(title) === index);

  if (titles.length === 0) return null;

  const titleList = (
    <p className="text-sm leading-6 text-zinc-400">{titles.join(" · ")}</p>
  );

  return titles.length > 3 ? (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm text-zinc-400 transition hover:text-violet-300">
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
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </h3>
      <p className="mt-2 text-zinc-200">{names.join(", ") || "Unknown"}</p>
    </div>
  );
}

function LoadError() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#251447_0%,#0a0910_38%)] px-4">
      <div className="max-w-md rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center">
        <h1 className="text-2xl font-bold text-white">
          We couldn’t load this manga
        </h1>
        <p className="mt-3 leading-7 text-zinc-300">
          It may be unavailable, or MangaDex may be having a temporary issue.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          Return to search
        </Link>
      </div>
    </main>
  );
}

export default async function MangaPage({ params }: MangaPageProps) {
  const { id } = await params;
  const response = await getManga(id).catch(() => null);

  if (!response) return <LoadError />;

  const manga = response.data;
  const title = localizedText(manga.attributes.title) || "Untitled";
  const description =
    localizedText(manga.attributes.description) || "No description available.";
  const cover = coverUrl(manga);
  const authors = relationshipNames(manga, "author");
  const artists = relationshipNames(manga, "artist");
  const tags = manga.attributes.tags ?? [];
  const metadata = {
    status: formatLabel(manga.attributes.status),
    year: manga.attributes.year?.toString() ?? "Unknown",
    rating: manga.attributes.contentRating
      ? formatLabel(manga.attributes.contentRating)
      : "Unknown",
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#251447_0%,#0a0910_38%)] px-4 py-8 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-violet-300"
        >
          <span aria-hidden="true">←</span> Back to search
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5.5 shadow-2xl shadow-black/20">
          <div className="grid gap-8 p-5 sm:p-7 md:grid-cols-[240px_1fr]">
            <div className="relative mx-auto aspect-2/3 w-full max-w-60 overflow-hidden rounded-2xl bg-zinc-900 shadow-xl md:mx-0">
              {cover ? (
                <Image
                  src={cover}
                  alt={`${title} cover`}
                  fill
                  priority
                  sizes="(max-width: 767px) 240px, 240px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                  Cover unavailable
                </div>
              )}
            </div>

            <div className="min-w-0 py-1">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
                Manga
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
              <div className="mt-3">
                <AlternativeTitles manga={manga} />
              </div>

              <dl className="mt-7 grid gap-3 sm:grid-cols-3">
                {Object.entries(metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-white/8 bg-white/4 p-4"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {metadataLabels[key as keyof typeof metadataLabels]}
                    </dt>
                    <dd className="mt-1 capitalize text-zinc-100">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="space-y-8 border-t border-white/10 p-5 sm:p-7">
            <section>
              <h2 className="text-xl font-semibold text-white">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-7 text-zinc-300">
                {description}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Tags</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full border border-violet-400/15 bg-violet-400/10 px-3 py-1.5 text-sm text-violet-200"
                    >
                      {localizedText(tag.attributes.name)}
                    </span>
                  ))
                ) : (
                  <p className="text-zinc-400">No tags available.</p>
                )}
              </div>
            </section>

            <section className="grid gap-6 rounded-2xl border border-white/8 bg-white/4 p-5 sm:grid-cols-2">
              <PeopleList label="Authors" names={authors} />
              <PeopleList label="Artists" names={artists} />
            </section>
          </div>
        </div>
      </article>
    </main>
  );
}
