export interface SearchOptions {
  title: string;
  limit?: number;
  offset?: number;
}

export type ContentRating = "safe" | "suggestive" | "erotica" | "pornographic";

export type MangaOrderField =
  | "followedCount"
  | "latestUploadedChapter"
  | "createdAt"
  | "updatedAt"
  | "rating"
  | "relevance";

export type SortDirection = "asc" | "desc";

export interface ListMangaOptions {
  title?: string;
  /** MangaDex caps this at 100 ids per request. */
  ids?: string[];
  limit?: number;
  offset?: number;
  order?: Partial<Record<MangaOrderField, SortDirection>>;
  contentRating?: ContentRating[];
  hasAvailableChapters?: boolean;
}

/**
 * MangaDex returns most human-readable text as a map of language code to value,
 * e.g. `{ en: "Solo Leveling", ja: "俺だけレベルアップな件" }`.
 */
export type LocalizedString = Record<string, string>;

export interface MangaDexRelationship {
  id: string;
  type: string;
  attributes?: {
    fileName?: string;
    name?: string;
  };
}

export interface MangaDexTag {
  id: string;
  type: "tag";
  attributes: {
    name: LocalizedString;
    group: string;
  };
}

export interface MangaDexManga {
  id: string;
  type: "manga";
  attributes: {
    title: LocalizedString;
    altTitles: LocalizedString[];
    description: LocalizedString;
    originalLanguage: string;
    status: string;
    year: number | null;
    contentRating: string;
    lastChapter: string | null;
    tags: MangaDexTag[];
  };
  relationships: MangaDexRelationship[];
}

/** A paginated list response, e.g. `GET /manga`. */
export interface MangaDexCollection<T> {
  result: "ok";
  response: "collection";
  data: T[];
  limit: number;
  offset: number;
  total: number;
}

/** A single-resource response, e.g. `GET /manga/{id}`. */
export interface MangaDexEntity<T> {
  result: "ok";
  response: "entity";
  data: T;
}

/** MangaDex serves chapter images from a per-chapter node, not a fixed CDN. */
export interface AtHomeServer {
  baseUrl: string;
  chapter: {
    hash: string;
    /** Full-quality page filenames. */
    data: string[];
    /** Smaller, recompressed versions of the same pages. */
    dataSaver: string[];
  };
}

export interface MangaDexChapter {
  id: string;
  type: "chapter";
  attributes: {
    volume: string | null;
    chapter: string | null;
    title: string | null;
    translatedLanguage: string;
    /**
     * Set when the chapter lives on another site (official simulpubs, for
     * example). Those have no pages and cannot be read through MangaDex.
     */
    externalUrl: string | null;
    isUnavailable: boolean;
    publishAt: string;
    readableAt: string;
    pages: number;
  };
  relationships: MangaDexRelationship[];
}

export type ChapterOrderField =
  "chapter" | "volume" | "publishAt" | "readableAt";

export interface ListChaptersOptions {
  mangaId: string;
  limit?: number;
  offset?: number;
  /** MangaDex needs explicit languages or it returns every translation. */
  translatedLanguage?: string[];
  order?: Partial<Record<ChapterOrderField, SortDirection>>;
}
