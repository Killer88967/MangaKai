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

/**
 * The title to show an English-reading visitor.
 *
 * MangaDex's `title` is the work's main title, which is usually the *romanised
 * original* rather than a translation — `{"zh-ro": "Qǐng Qīfu Wǒ ba, Èyì
 * Xiǎojiě!"}` — and the English title is filed away in `altTitles`. For
 * Japanese series the romanisation is often the same string readers know
 * ("Berserk", "One Piece"), which is why this looks correct until a Chinese or
 * Korean series shows up.
 *
 * So: a real English title first, wherever it is stored, and only then fall
 * back to the romanised original — a title someone cannot read beats no title,
 * but it is the last resort, not the default.
 */
function pickTitle(manga: MangaDexManga): string {
  const { title, altTitles, originalLanguage } = manga.attributes;

  if (title.en) return title.en;

  const english = (altTitles ?? []).find((alt) => alt.en)?.en;

  if (english) return english;

  return (
    title[`${originalLanguage}-ro`] ??
    title[originalLanguage] ??
    Object.values(title)[0] ??
    "Untitled"
  );
}

/**
 * Every other name the work goes by, the chosen title removed.
 *
 * `attributes.title` is included deliberately: once an English alt title is
 * promoted, the romanised original would otherwise disappear from the app
 * entirely, and it is the name a reader may well have searched for.
 */
function toAltTitles(manga: MangaDexManga, chosen: string): string[] {
  const titles = [
    ...Object.values(manga.attributes.title),
    ...(manga.attributes.altTitles ?? []).flatMap((title) =>
      Object.values(title),
    ),
  ];

  return [...new Set(titles)].filter((title) => title !== chosen);
}

function toSummary(manga: MangaDexManga): MangaSummary {
  return {
    id: manga.id,
    title: pickTitle(manga),
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
  const summary = toSummary(manga);

  return {
    ...summary,
    altTitles: toAltTitles(manga, summary.title),
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
 * Fetches the medium MangaDex cover used by MangaKai's offline library.
 *
 * This stays server-side so browsers never need to CORS-fetch MangaDex's
 * uploads host when creating an offline download.
 */
export async function getMangaCoverImage(id: string): Promise<Response> {
  const manga = await getMangaById(id);
  const coverUrl = manga.cover?.medium ?? manga.cover?.original;

  if (!coverUrl) {
    throw new Error("This manga has no cover.");
  }

  const repsonse = await fetch(coverUrl, {
    headers: {
      "User-Agent": "MangaKai/1.0",
    },
  });

  if (!repsonse.ok) {
    throw new Error(`MangaDex cover request failed (${repsonse.status}).`);
  }

  return repsonse;
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
