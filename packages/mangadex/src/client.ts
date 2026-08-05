const BASE_URL = "https://api.mangadex.org";

export async function mdFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    throw new Error(`MangaDex returned ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
