const CACHE_NAME = "mangakai-chapters-v1";

function pageCacheUrl(chapterId: string, page: number): string {
  return `/offline/chapters/${chapterId}/${page}`;
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

export async function downloadChapter(
  chapterId: string,
  pageCount: number,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<void> {
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
      throw new Error(`Failed to download page ${page + 1}.`);
    }

    await cache.put(cacheUrl, response);

    onProgress?.(page + 1, pageCount);
  }
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
