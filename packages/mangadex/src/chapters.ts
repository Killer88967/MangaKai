import { mdFetch } from "./client";
import type {
  AtHomeServer,
  ListChaptersOptions,
  MangaDexChapter,
  MangaDexCollection,
} from "./types";

/** Without this MangaDex returns every translation of every chapter. */
const DEFAULT_LANGUAGES = ["en"] as const;

/**
 * A manga's chapter feed.
 *
 * `includes[]=scanlation_group` costs nothing extra and saves a second request
 * per chapter to name the group that translated it.
 */
export function listChapters({
  mangaId,
  limit = 100,
  offset = 0,
  translatedLanguage = [...DEFAULT_LANGUAGES],
  order = { chapter: "asc" },
}: ListChaptersOptions) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  for (const language of translatedLanguage) {
    params.append("translatedLanguage[]", language);
  }

  for (const [field, direction] of Object.entries(order)) {
    params.set(`order[${field}]`, direction);
  }

  params.append("includes[]", "scanlation_group");

  return mdFetch<MangaDexCollection<MangaDexChapter>>(
    `/manga/${mangaId}/feed?${params.toString()}`,
  );
}

/**
 * Where a chapter's images actually live.
 *
 * MangaDex hands out a node per chapter rather than serving from one CDN, and
 * the response is short-lived — resolve it when the reader opens, never cache
 * it alongside the chapter list.
 */
export function getAtHomeServer(chapterId: string) {
  return mdFetch<AtHomeServer>(`/at-home/server/${chapterId}`);
}
