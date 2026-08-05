const BASE_URL = "https://api.mangadex.org";

/** Covers are served from a separate host to the JSON API. */
export const UPLOADS_BASE_URL = "https://uploads.mangadex.org";

export async function mdFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    throw new Error(`MangaDex returned ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
