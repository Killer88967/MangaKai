export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: {
    fileName?: string;
    name?: string;
  };
}

export interface MangaDexTag {
  id: string;
  attributes: {
    name: Record<string, string>;
  };
}

export interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    altTitles?: Record<string, string>[];
    status: string;
    year?: number | null;
    contentRating?: string;
    tags?: MangaDexTag[];
    lastChapter: string | null;
  };
  relationships: MangaDexRelationship[];
}

export interface MangaSearchResponse {
  result: "ok" | "error";
  data: MangaDexManga[];
}

export interface MangaDetailsResponse {
  result: "ok" | "error";
  data: MangaDexManga;
}

interface ApiError {
  error?: string;
}

export async function searchManga(query: string, signal?: AbortSignal) {
  const response = await fetch(
    `/api/manga/search?q=${encodeURIComponent(query)}`,
    {
      signal,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error ?? "Search failed. Please try again.");
  }

  return response.json() as Promise<MangaSearchResponse>;
}

export async function getManga(id: string) {
  const apiUrl = process.env.API_URL ?? "http://localhost:8787";
  const response = await fetch(
    `${apiUrl}/api/manga/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to load manga.");
  }

  return response.json() as Promise<MangaDetailsResponse>;
}

export function localizedText(values: Record<string, string>): string {
  return values.en ?? Object.values(values)[0] ?? "";
}

export function coverUrl(manga: MangaDexManga): string | null {
  const cover = manga.relationships.find(({ type }) => type === "cover_art");

  return cover?.attributes?.fileName
    ? `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.256.jpg`
    : null;
}

export function relationshipNames(
  manga: MangaDexManga,
  type: "author" | "artist",
): string[] {
  return manga.relationships
    .filter((relationship) => relationship.type === type)
    .map((relationship) => relationship.attributes?.name)
    .filter((name): name is string => Boolean(name));
}
