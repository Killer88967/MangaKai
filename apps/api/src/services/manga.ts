import {
  getManga as getMangaDexManga,
  listManga as listMangaDexManga,
  searchManga as searchMangaDexManga,
  UPLOADS_BASE_URL,
  type LocalizedString,
  type MangaDexManga,
} from "@mangakai/mangadex";
import type {
  Manga,
  MangaCategory,
  MangaCover,
  MangaSummary,
  MangaTag,
  Paginated,
} from "@mangakai/shared";

/**
 * MangaDex localizes text as a language map. We prefer English, then fall back
 * to whatever the entry actually has so nothing renders blank.
 */
function localized(values: LocalizedString | undefined): string {
  if (!values) return "";

  return values.en ?? Object.values(values)[0] ?? "";
}

function toCover(manga: MangaDexManga): MangaCover | null {
  const fileName = manga.relationships.find(
    (relationship) => relationship.type === "cover_art",
  )?.attributes?.fileName;

  if (!fileName) return null;

  const base = `${UPLOADS_BASE_URL}/covers/${manga.id}/${fileName}`;

  return {
    small: `${base}.256.jpg`,
    medium: `${base}.512.jpg`,
    original: base,
  };
}

function relationshipNames(
  manga: MangaDexManga,
  type: "author" | "artist",
): string[] {
  return manga.relationships
    .filter((relationship) => relationship.type === type)
    .map((relationship) => relationship.attributes?.name)
    .filter((name): name is string => Boolean(name));
}

function toTags(manga: MangaDexManga): MangaTag[] {
  return manga.attributes.tags.map((tag) => ({
    id: tag.id,
    name: localized(tag.attributes.name),
  }));
}

function toAltTitles(manga: MangaDexManga): string[] {
  const titles = (manga.attributes.altTitles ?? []).flatMap((title) =>
    Object.values(title),
  );

  return [...new Set(titles)];
}

function toSummary(manga: MangaDexManga): MangaSummary {
  return {
    id: manga.id,
    title: localized(manga.attributes.title) || "Untitled",
    description: localized(manga.attributes.description),
    cover: toCover(manga),
    status: manga.attributes.status,
    year: manga.attributes.year ?? null,
    contentRating: manga.attributes.contentRating,
    // MangaDex uses "" rather than null for "no final chapter yet".
    lastChapter: manga.attributes.lastChapter || null,
  };
}

function toManga(manga: MangaDexManga): Manga {
  return {
    ...toSummary(manga),
    altTitles: toAltTitles(manga),
    tags: toTags(manga),
    authors: relationshipNames(manga, "author"),
    artists: relationshipNames(manga, "artist"),
  };
}

export async function searchManga(
  title: string,
  { limit, offset }: { limit: number; offset: number },
): Promise<Paginated<MangaSummary>> {
  const response = await searchMangaDexManga({ title, limit, offset });

  return {
    data: response.data.map(toSummary),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

export async function getMangaById(id: string): Promise<Manga> {
  const response = await getMangaDexManga(id);

  return toManga(response.data);
}

/**
 * How each MangaKai category maps onto a MangaDex sort. Keeping the mapping
 * here means clients never learn MangaDex's field names, so we can change what
 * "popular" means — to our own follow counts, say — without touching them.
 */
const CATEGORY_ORDERS = {
  popular: { followedCount: "desc" },
  latest: { latestUploadedChapter: "desc" },
  recent: { createdAt: "desc" },
} as const satisfies Record<MangaCategory, Record<string, "desc">>;

/** A browsable, pageable row. The homepage takes the first page of each. */
export async function browseManga(
  category: MangaCategory,
  { limit, offset }: { limit: number; offset: number },
): Promise<Paginated<MangaSummary>> {
  const response = await listMangaDexManga({
    limit,
    offset,
    order: CATEGORY_ORDERS[category],
    hasAvailableChapters: true,
  });

  return {
    data: response.data.map(toSummary),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

/** Most followed on MangaDex — our stand-in for "popular" until we track our own. */
export async function getPopularManga(limit: number): Promise<MangaSummary[]> {
  return (await browseManga("popular", { limit, offset: 0 })).data;
}

export async function getLatestUpdates(limit: number): Promise<MangaSummary[]> {
  return (await browseManga("latest", { limit, offset: 0 })).data;
}

export async function getRecentlyAdded(limit: number): Promise<MangaSummary[]> {
  return (await browseManga("recent", { limit, offset: 0 })).data;
}

/**
 * Hydrates MangaKai references (staff picks, bookmarks, history) into real
 * manga. Returns a map so callers can preserve their own ordering.
 */
export async function getMangaSummariesByIds(
  ids: string[],
): Promise<Map<string, MangaSummary>> {
  if (ids.length === 0) return new Map();

  const response = await listMangaDexManga({
    ids: ids.slice(0, 100),
    limit: Math.min(ids.length, 100),
    // Explicit id lookups must not inherit the browse content filter, or a
    // staff pick outside it would silently vanish from the row.
    contentRating: ["safe", "suggestive", "erotica", "pornographic"],
  });

  return new Map(response.data.map((manga) => [manga.id, toSummary(manga)]));
}
