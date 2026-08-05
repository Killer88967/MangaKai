import { mdFetch } from "./client";
import type { SearchOptions } from "./types";

export function searchManga({ title, limit = 10 }: SearchOptions) {
  const params = new URLSearchParams({ title, limit: String(limit) });
  params.append("includes[]", "cover_art");

  return mdFetch(`/manga?${params.toString()}`);
}
