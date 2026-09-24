import {
  getAtHomeServer,
  listChapters as listMangaDexChapters,
  type MangaDexChapter,
} from "@mangakai/mangadex";
import type {
  Chapter,
  ChapterPageReport,
  ChapterPages,
  Paginated,
} from "@mangakai/shared";

/** MangaDex@Home health reporting. Note the host differs from the JSON API. */
const REPORT_URL = "https://api.mangadex.network/report";

/** Reports are pointless if they outlive the read; do not hold a request open. */
const REPORT_TIMEOUT_MS = 5000;

/**
 * Whether we can actually render the chapter.
 *
 * MangaDex lists chapters it does not host: official simulpubs carry an
 * `externalUrl` and no pages, and uploads can be withdrawn. Deciding this once
 * here keeps clients from each inventing their own version of the rule.
 */
function isReadable(chapter: MangaDexChapter): boolean {
  const { externalUrl, isUnavailable, pages } = chapter.attributes;

  return !externalUrl && !isUnavailable && pages > 0;
}

function scanlationGroupName(chapter: MangaDexChapter): string | null {
  const group = chapter.relationships.find(
    (relationship) => relationship.type === "scanlation_group",
  );

  return group?.attributes?.name ?? null;
}

function toChapter(chapter: MangaDexChapter): Chapter {
  const { attributes } = chapter;

  return {
    id: chapter.id,
    // MangaDex uses "" as well as null for "no number".
    number: attributes.chapter || null,
    volume: attributes.volume || null,
    title: attributes.title || null,
    language: attributes.translatedLanguage,
    pages: attributes.pages,
    publishedAt: attributes.publishAt,
    scanlationGroup: scanlationGroupName(chapter),
    readable: isReadable(chapter),
    externalUrl: attributes.externalUrl || null,
  };
}

export async function getChapters(
  mangaId: string,
  { limit, offset }: { limit: number; offset: number },
): Promise<Paginated<Chapter>> {
  const response = await listMangaDexChapters({
    mangaId,
    limit,
    offset,
    order: { chapter: "asc" },
  });

  return {
    data: response.data.map(toChapter),
    total: response.total,
    limit: response.limit,
    offset: response.offset,
  };
}

/**
 * Resolves a chapter's page images to absolute URLs.
 *
 * The `data` set is full quality and `dataSaver` is recompressed; we serve
 * full quality and leave bandwidth choices to a later setting.
 *
 * MangaDex guarantees the returned host for roughly 15 minutes — "Could be
 * more, could be less" — and answers 403 afterwards, so these URLs must be
 * resolved when a reader opens and never stored. Clients treat a failed image
 * as a signal to ask for a fresh host rather than as a broken chapter.
 *
 * @see https://api.mangadex.org/docs/04-chapter/retrieving-chapter/
 */
export async function getChapterPages(
  chapterId: string,
): Promise<ChapterPages> {
  const server = await getAtHomeServer(chapterId);
  const { hash, data } = server.chapter;

  return {
    id: chapterId,
    pages: data.map((file) => `${server.baseUrl}/data/${hash}/${file}`),
  };
}

/** REPLACE WITH ACTUAL DOC */
export async function getChapterPage(
  chapterId: string,
  pageIndex: number,
): Promise<Response> {
  const server = await getAtHomeServer(chapterId);
  const { hash, data } = server.chapter;

  const file = data[pageIndex];

  if (!file) {
    throw new RangeError("Chapter page does not exist.");
  }

  const url = `${server.baseUrl}/data/${hash}/${file}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `MangaDex@Home returned ${response.status} for chapter page.`,
    );
  }

  return response;
}

/**
 * Forwards a client's page-load result to MangaDex@Home.
 *
 * Images are fetched by the client directly from the node — that is what the
 * network is built for, and proxying them here would throw away its geo
 * distribution. But it means only the client sees the timing and byte count,
 * so it measures and we relay, keeping MangaDex off the clients' network.
 *
 * MangaDex requires the content type to be exactly `application/json`.
 *
 * @see https://api.mangadex.org/docs/04-chapter/retrieving-chapter/
 */
export async function reportPageLoad(report: ChapterPageReport): Promise<void> {
  const response = await fetch(REPORT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
    signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`MangaDex@Home report returned ${response.status}`);
  }
}
