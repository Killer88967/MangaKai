const CACHE_NAME = "mangakai-chapters-v1";
const METADATA_KEY = "mangakai-downloaded-chapters-v1";

export interface DownloadedChapter {
  chapterId: string;
  mangaId: string | null;
  heading: string;
  pageCount: number;
  downloadedAt: string;
}

interface DownloadChapterOptions {
  chapterId: string;
  mangaId: string | null;
  heading: string;
  pageCount: number;
  onProgress?: (downloaded: number, total: number) => void;
}

function pageCacheUrl(chapterId: string, page: number): string {
  return `/offline/chapters/${chapterId}/${page}`;
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

function saveChapterMetadata(chapter: DownloadedChapter): void {
  const chapters = readMetadata().filter(
    (item) => item.chapterId !== chapter.chapterId,
  );

  chapters.unshift(chapter);

  writeMetadata(chapters);
}

function removeChapterMetadata(chapterId: string): void {
  writeMetadata(readMetadata().filter((item) => item.chapterId !== chapterId));
}

export function getDownloadedChapters(): DownloadedChapter[] {
  return readMetadata().sort(
    (a, b) =>
      new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
  );
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
  heading,
  pageCount,
  onProgress,
}: DownloadChapterOptions): Promise<void> {
  const cache = await caches.open(CACHE_NAME);

  for (let page = 0; page < pageCount; page += 1) {
    const cacheUrl = pageCacheUrl(chapterId, page);
    const existing = await cache.match(cacheUrl);

    if (existing) {
      onProgress?.(page + 1, pageCount);
      continue;
    }

    const response = await fetch(
      `/api/chapters/${encodeURIComponent(chapterId)}/download/${page}`,
      { cache: "no-store" },
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

  saveChapterMetadata({
    chapterId,
    mangaId,
    heading,
    pageCount,
    downloadedAt: new Date().toISOString(),
  });
}

export async function deleteDownloadedChapter(
  chapterId: string,
): Promise<void> {
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

  removeChapterMetadata(chapterId);
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
