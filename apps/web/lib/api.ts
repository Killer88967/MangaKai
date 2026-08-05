import type {
  ApiError,
  Banner,
  HomePage,
  Manga,
  MangaSummary,
  Paginated,
} from "@mangakai/shared";

/**
 * Server components call the API directly; the browser goes through the
 * `/api/:path*` rewrite in `next.config.ts`, since rewrites only apply to
 * requests that actually pass through Next.
 */
const API_URL = process.env.API_URL ?? "http://localhost:8787";

async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as Partial<ApiError>;

  return body.error ?? fallback;
}

export async function searchManga(
  query: string,
  signal?: AbortSignal,
): Promise<Paginated<MangaSummary>> {
  const response = await fetch(
    `/api/manga/search?q=${encodeURIComponent(query)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Search failed. Please try again."),
    );
  }

  return response.json();
}

/** Banners are site-wide, so the root layout fetches them for every page. */
export async function getBanners(): Promise<Banner[]> {
  const response = await fetch(`${API_URL}/api/banners`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Unable to load banners."));
  }

  return response.json();
}

export async function getHomePage(): Promise<HomePage> {
  const response = await fetch(`${API_URL}/api/home`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Unable to load the homepage."),
    );
  }

  return response.json();
}

export async function getManga(id: string): Promise<Manga> {
  const response = await fetch(
    `${API_URL}/api/manga/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Unable to load manga."));
  }

  return response.json();
}
