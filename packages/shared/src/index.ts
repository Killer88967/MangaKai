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

/** One translated chapter of a manga. */
export interface Chapter {
  id: string;
  /** Chapter number as MangaDex records it — "43.5" is legal. Null for oneshots. */
  number: string | null;
  volume: string | null;
  title: string | null;
  language: string;
  pages: number;
  publishedAt: string;
  scanlationGroup: string | null;
  /**
   * Whether MangaKai can display it. False for chapters hosted elsewhere
   * (official simulpubs) or pulled by the uploader — the API decides, so
   * clients never re-derive the rule.
   */
  readable: boolean;
  /** Where to send the reader when `readable` is false. */
  externalUrl: string | null;
}

/** Resolved image URLs for one chapter, in reading order. */
export interface ChapterPages {
  id: string;
  pages: string[];
}

/**
 * What a client tells us about one page image it fetched.
 *
 * MangaDex@Home is a volunteer network that relies on these to spot unhealthy
 * nodes, and the client is the only party that sees the fetch — images come
 * straight from the node, not through our API. Clients post this to
 * `/api/chapters/report` and the API forwards it; they never call MangaDex.
 */
export interface ChapterPageReport {
  /** The full image URL that was fetched, including the scheme. */
  url: string;
  success: boolean;
  /** True when the response's `X-Cache` header started with `HIT`. */
  cached: boolean;
  /** Bytes received. */
  bytes: number;
  /** Total retrieval time in milliseconds. */
  duration: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * The browsable homepage rows. Each maps to a MangaDex sort order in the API —
 * clients only ever send these names, never an upstream sort field.
 */
export const MANGA_CATEGORIES = ["popular", "latest", "recent"] as const;
export type MangaCategory = (typeof MANGA_CATEGORIES)[number];

export const MANGA_CATEGORY_TITLES: Record<MangaCategory, string> = {
  popular: "Trending",
  latest: "Latest Updates",
  recent: "Recently Added",
};

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

export const USER_ROLES = [
  "user",
  "creator",
  "moderator",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/**
 * A MangaKai account.
 *
 * Never carries the password hash — this is the shape that goes over the wire
 * and into both clients, so there is nothing here that must not be shown.
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

/**
 * What `register` and `login` return.
 *
 * The API sets an httpOnly cookie *and* returns the token, because the two
 * clients need different things: the browser uses the cookie it cannot read,
 * and the phone stores `token` itself and sends it as a bearer. Each ignores
 * the half it does not need.
 */
export interface AuthResponse {
  user: User;
  token: string;
  /** When the session stops working, so a client can pre-emptively re-auth. */
  expiresAt: string;
}

/** A MangaKai editorial pick, hydrated with the manga from MangaDex. */
export interface StaffPick {
  manga: MangaSummary;
  note: string | null;
}

/**
 * What an admin sees: the stored row plus its manga title, without dropping
 * picks MangaDex cannot resolve — an admin needs to see a broken pick in order
 * to fix it, where a visitor should simply never be shown one.
 */
export interface AdminStaffPick {
  id: string;
  mangaId: string;
  /** Null when MangaDex no longer returns this manga. */
  title: string | null;
  note: string | null;
  position: number;
  active: boolean;
  createdAt: string;
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
