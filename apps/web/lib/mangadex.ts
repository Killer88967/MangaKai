export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: { fileName?: string };
}

export interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: {
    title: Record<string, string>;
    description: Record<string, string>;
    status: string;
    lastChapter: string | null;
  };
  relationships: MangaDexRelationship[];
}

export interface MangaSearchResponse {
  result: "ok" | "error";
  data: MangaDexManga[];
}

interface ApiError {
  error?: string;
}

export async function searchManga(query: string, signal?: AbortSignal) {
  const response = await fetch(`/api/manga/search?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.error ?? "Search failed. Please try again.");
  }

  return response.json() as Promise<MangaSearchResponse>;
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
