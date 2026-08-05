/**
 * MangaKai's own API contract.
 *
 * These are the shapes the API returns and both clients consume. They are
 * deliberately independent of MangaDex's wire format: the API translates
 * MangaDex responses into these types, so upstream changes stay contained in
 * `apps/api` and `packages/mangadex`.
 */

/** MangaDex serves several sizes off one uploaded cover file. */
export interface MangaCover {
  small: string;
  medium: string;
  original: string;
}

export interface MangaTag {
  id: string;
  name: string;
}

/** Enough to render a card in a grid or a carousel row. */
export interface MangaSummary {
  id: string;
  title: string;
  description: string;
  cover: MangaCover | null;
  status: string;
  year: number | null;
  contentRating: string;
  lastChapter: string | null;
}

/** Everything a manga detail page needs. */
export interface Manga extends MangaSummary {
  altTitles: string[];
  tags: MangaTag[];
  authors: string[];
  artists: string[];
}

export interface Paginated<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
}

/* ------------------------------------------------------------------ *
 * MangaKai-owned data. None of this comes from MangaDex.
 * ------------------------------------------------------------------ */

export const BANNER_VARIANTS = ["info", "announcement", "warning"] as const;
export type BannerVariant = (typeof BANNER_VARIANTS)[number];

/** What a visitor sees. Scheduling and draft state stay server-side. */
export interface Banner {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  variant: BannerVariant;
}

/** What an admin sees — adds the fields that decide whether it is live. */
export interface AdminBanner extends Banner {
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A MangaKai editorial pick, hydrated with the manga from MangaDex. */
export interface StaffPick {
  manga: MangaSummary;
  note: string | null;
}

/**
 * The homepage payload: MangaKai's own data merged with MangaDex content in a
 * single response, so the client makes one request instead of six.
 */
export interface HomePage {
  banners: Banner[];
  hero: MangaSummary | null;
  staffPicks: StaffPick[];
  popular: MangaSummary[];
  latestUpdates: MangaSummary[];
  recentlyAdded: MangaSummary[];
}
