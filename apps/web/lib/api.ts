import type {
  ApiError,
  Banner,
  Chapter,
  ChapterPageReport,
  ChapterPages,
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

export async function getChapters(
  mangaId: string,
  { limit = 100, offset = 0 } = {},
): Promise<Paginated<Chapter>> {
  const response = await fetch(
    `${API_URL}/api/manga/${encodeURIComponent(mangaId)}/chapters?limit=${limit}&offset=${offset}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Unable to load chapters."));
  }

  return response.json();
}

/**
 * Page images for one chapter.
 *
 * Called from the reader in the browser, so it uses the relative rewrite
 * rather than `API_URL`. Never cached: MangaDex guarantees the host for only
 * about 15 minutes, then answers 403.
 */
export async function getChapterPages(
  chapterId: string,
  signal?: AbortSignal,
): Promise<ChapterPages> {
  const response = await fetch(
    `/api/chapters/${encodeURIComponent(chapterId)}/pages`,
    { cache: "no-store", signal },
  );

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Unable to load this chapter."),
    );
  }

  return response.json();
}

/**
 * Tells MangaDex@Home how a page fetch went, via our API.
 *
 * Fire and forget: the reader must never stall or error because a health
 * report failed.
 */
export function reportPageLoad(report: ChapterPageReport): void {
  void fetch("/api/chapters/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    keepalive: true,
  }).catch(() => {
    // Reporting is best effort; a dropped report is not the reader's problem.
  });
}
