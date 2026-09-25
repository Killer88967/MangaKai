const CACHE_NAME = "mangakai-chapters-v1";
const METADATA_KEY = "mangakai-downloaded-chapters-v1";

export interface DownloadedChapter {
  chapterId: string;
  mangaId: string | null;

  /**
   * Series metadata is stored with the chapter so the Downloads library can
   * group chapters without making another API request.
   *
   * Optional for backwards compatibility with downloads created before the
   * catalogue-style Downloads page existed.
   */
  mangaTitle?: string;
  mangaCover?: string | null;

  heading: string;
  pageCount: number;
  downloadedAt: string;
}

export interface DownloadedManga {
  mangaId: string;
  title: string;
  cover: string | null;
  chapters: DownloadedChapter[];
}

interface DownloadChapterOptions {
  chapterId: string;
  mangaId: string | null;
  mangaTitle?: string;
  mangaCover?: string | null;
  heading: string;
  pageCount: number;
  onProgress?: (downloaded: number, total: number) => void;
}

function pageCacheUrl(chapterId: string, page: number): string {
  return `/offline/chapters/${chapterId}/${page}`;
}

function coverCacheUrl(mangaId: string): string {
  return `/offline/covers/${encodeURIComponent(mangaId)}`;
}

function readMetadata(): DownloadedChapter[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(METADATA_KEY);

    if (!raw) return [];

    return JSON.parse(raw) as DownloadedChapter[];
  } catch {
    return [];
  }
}

function writeMetadata(chapters: DownloadedChapter[]): void {
  window.localStorage.setItem(METADATA_KEY, JSON.stringify(chapters));
}

/** @deprecated */
function removeChapterMetadata(chapterId: string): void {
  writeMetadata(readMetadata().filter((item) => item.chapterId !== chapterId));
}

async function cacheMangaCover(mangaId: string | null): Promise<void> {
  if (!mangaId) return;

  const cache = await caches.open(CACHE_NAME);
  const cacheUrl = coverCacheUrl(mangaId);

  const existing = await cache.match(cacheUrl);

  if (existing) return;

  try {
    const response = await fetch(
      `/api/manga/${encodeURIComponent(mangaId)}/cover`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) return;

    await cache.put(cacheUrl, response);
  } catch {
    // Cover failure should not stop the chapter itself from downloading.
  }
}

export function getDownloadedChapters(): DownloadedChapter[] {
  return readMetadata().sort(
    (a, b) =>
      new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
  );
}

/**
 * Groups downloaded chapters into their parent manga.
 *
 * Older downloads may not have series metadata yet. As long as they have a
 * manga id they still receive their own catalogue entry, and opening that
 * chapter online later can repair the missing title/cover metadata.
 */
export function getDownloadedManga(): DownloadedManga[] {
  const grouped = new Map<string, DownloadedManga>();

  for (const chapter of getDownloadedChapters()) {
    const mangaId = chapter.mangaId ?? `unknown:${chapter.chapterId}`;

    const existing = grouped.get(mangaId);

    if (existing) {
      existing.chapters.push(chapter);

      if (!existing.cover && chapter.mangaCover) {
        existing.cover = chapter.mangaCover;
      }

      if (existing.title === "Unknown series" && chapter.mangaTitle) {
        existing.title = chapter.mangaTitle;
      }

      continue;
    }

    grouped.set(mangaId, {
      mangaId,
      title: chapter.mangaTitle ?? "Unknown series",
      cover: chapter.mangaCover ?? null,
      chapters: [chapter],
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const aLatest = new Date(a.chapters[0]?.downloadedAt ?? 0).getTime();
    const bLatest = new Date(b.chapters[0]?.downloadedAt ?? 0).getTime();

    return bLatest - aLatest;
  });
}

export async function getDownloadedCoverUrl(
  mangaId: string,
): Promise<string | null> {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(coverCacheUrl(mangaId));

  if (!response) return null;

  const blob = await response.blob();

  return URL.createObjectURL(blob);
}

export async function getDownloadedPageCount(
  chapterId: string,
): Promise<number> {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  const prefix = new URL(
    `/offline/chapters/${chapterId}/`,
    window.location.origin,
  ).href;

  return requests.filter((request) => request.url.startsWith(prefix)).length;
}

export async function isChapterDownloaded(
  chapterId: string,
  pageCount: number,
): Promise<boolean> {
  return (await getDownloadedPageCount(chapterId)) === pageCount;
}

export async function downloadChapter({
  chapterId,
  mangaId,
  mangaTitle,
  mangaCover,
  heading,
  pageCount,
  onProgress,
}: DownloadChapterOptions): Promise<void> {
  const cache = await caches.open(CACHE_NAME);

  await cacheMangaCover(mangaId);

  for (let page = 0; page < pageCount; page += 1) {
    const cacheUrl = pageCacheUrl(chapterId, page);
    const existing = await cache.match(cacheUrl);

    if (existing) {
      onProgress?.(page + 1, pageCount);
      continue;
    }

    const response = await fetch(
      `/api/chapters/${encodeURIComponent(chapterId)}/download/${page}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      throw new Error(
        body?.error ??
          `Failed to download page ${page + 1} (${response.status}).`,
      );
    }

    await cache.put(cacheUrl, response);

    onProgress?.(page + 1, pageCount);
  }

  saveDownloadedChapterMetadata({
    chapterId,
    mangaId,
    mangaTitle,
    mangaCover,
    heading,
    pageCount,
    downloadedAt: new Date().toISOString(),
  });
}

export function getDownloadedChapter(
  chapterId: string,
): DownloadedChapter | undefined {
  return readMetadata().find((chapter) => chapter.chapterId === chapterId);
}

export function saveDownloadedChapterMetadata(
  chapter: DownloadedChapter,
): void {
  const existing = readMetadata().find(
    (item) => item.chapterId === chapter.chapterId,
  );

  const chapters = readMetadata().filter(
    (item) => item.chapterId !== chapter.chapterId,
  );

  /**
   * Preserve series metadata when an older call only repairs chapter metadata.
   * This prevents a later reader visit from accidentally erasing the catalogue
   * title or cover that was stored when the chapter was downloaded.
   */
  chapters.unshift({
    ...existing,
    ...chapter,
    mangaTitle: chapter.mangaTitle ?? existing?.mangaTitle,
    mangaCover: chapter.mangaCover ?? existing?.mangaCover ?? null,
  });

  writeMetadata(chapters);
}

export async function deleteDownloadedChapter(
  chapterId: string,
): Promise<void> {
  const metadata = readMetadata();
  const chapter = metadata.find((item) => item.chapterId === chapterId);

  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  const prefix = new URL(
    `/offline/chapters/${chapterId}/`,
    window.location.origin,
  ).href;

  await Promise.all(
    requests
      .filter((request) => request.url.startsWith(prefix))
      .map((request) => cache.delete(request)),
  );

  const remaining = metadata.filter((item) => item.chapterId !== chapterId);

  writeMetadata(remaining);

  if (
    chapter?.mangaId &&
    !remaining.some((item) => item.mangaId === chapter.mangaId)
  ) {
    await cache.delete(coverCacheUrl(chapter.mangaId));
  }
}

/**
 * Removes every downloaded chapter belonging to one manga.
 *
 * Chapters downloaded before series metadata existed may not have a manga id.
 * `getDownloadedManga()` gives those a synthetic `unknown:<chapterId>` key, so
 * handle that key here as well rather than leaving old downloads undeletable.
 */
export async function deleteDownloadedManga(mangaId: string): Promise<void> {
  const chapters = readMetadata().filter((chapter) => {
    if (chapter.mangaId === mangaId) return true;

    return (
      chapter.mangaId === null && mangaId === `unknown:${chapter.chapterId}`
    );
  });

  await Promise.all(
    chapters.map((chapter) => deleteDownloadedChapter(chapter.chapterId)),
  );

  if (!mangaId.startsWith("unknown:")) {
    const cache = await caches.open(CACHE_NAME);

    await cache.delete(coverCacheUrl(mangaId));
  }
}

export async function getDownloadedPageUrls(
  chapterId: string,
): Promise<string[]> {
  const cache = await caches.open(CACHE_NAME);
  const count = await getDownloadedPageCount(chapterId);

  const urls: string[] = [];

  for (let page = 0; page < count; page += 1) {
    const response = await cache.match(pageCacheUrl(chapterId, page));

    if (!response) break;

    const blob = await response.blob();

    urls.push(URL.createObjectURL(blob));
  }

  return urls;
}
