import { mdFetch } from "./client";
import type {
  ListMangaOptions,
  MangaDexCollection,
  MangaDexEntity,
  MangaDexManga,
  SearchOptions,
} from "./types";

/** MangaDex returns everything up to erotica unless told otherwise. */
const DEFAULT_CONTENT_RATING = ["safe", "suggestive"] as const;

function buildParams({
  title,
  ids = [],
  limit = 10,
  offset = 0,
  order = {},
  contentRating = [...DEFAULT_CONTENT_RATING],
  hasAvailableChapters,
}: ListMangaOptions): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (title) params.set("title", title);
  if (hasAvailableChapters) params.set("hasAvailableChapters", "true");

  for (const id of ids) params.append("ids[]", id);
  for (const rating of contentRating) params.append("contentRating[]", rating);
  for (const [field, direction] of Object.entries(order)) {
    params.set(`order[${field}]`, direction);
  }

  params.append("includes[]", "cover_art");

  return params;
}

/** The general list endpoint: search, ordered rows and id lookups all use it. */
export function listManga(options: ListMangaOptions = {}) {
  return mdFetch<MangaDexCollection<MangaDexManga>>(
    `/manga?${buildParams(options).toString()}`,
  );
}

export function searchManga({ title, limit = 10, offset = 0 }: SearchOptions) {
  return listManga({ title, limit, offset });
}

export function getManga(id: string) {
  const params = new URLSearchParams();
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("includes[]", "artist");

  return mdFetch<MangaDexEntity<MangaDexManga>>(
    `/manga/${id}?${params.toString()}`,
  );
}
