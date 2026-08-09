import type {
  ApiError,
  AuthResponse,
  Chapter,
  ChapterPages,
  HomePage,
  Manga,
  MangaCategory,
  MangaSummary,
  Paginated,
  User,
} from "@mangakai/shared";

/**
 * Clients never talk to MangaDex — everything comes from MangaKai's API.
 *
 * The phone is not this machine, so `localhost` only resolves when the API runs
 * alongside a simulator. `scripts/start-expo.sh` exports the Codespaces URL;
 * override it in `apps/mobile/.env` for anything else.
 *
 * Expo inlines `EXPO_PUBLIC_*` into the bundle at build time, so this has to be
 * the literal `process.env.EXPO_PUBLIC_API_URL` rather than a computed key —
 * and changing it means restarting Metro, not just reloading the app.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

/** The API reports failures as `{ error }`; fall back if that shape is missing. */
async function errorMessage(response: Response, fallback: string) {
  const body = (await response.json().catch(() => ({}))) as Partial<ApiError>;

  return body.error ?? fallback;
}

/**
 * The whole homepage in one request: MangaKai's own banners and staff picks,
 * merged by the API with the rows it pulls from MangaDex.
 *
 * Pass a signal from an effect so a screen that unmounts mid-flight cancels
 * instead of setting state on a gone component.
 */
export async function getHomePage(signal?: AbortSignal): Promise<HomePage> {
  const response = await fetch(`${API_URL}/api/home`, { signal });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Unable to load the homepage."),
    );
  }

  return response.json();
}

/** One manga, with the fields a row card does not carry: tags, authors, artists. */
export async function getManga(
  id: string,
  signal?: AbortSignal,
): Promise<Manga> {
  const response = await fetch(
    `${API_URL}/api/manga/${encodeURIComponent(id)}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Unable to load manga."));
  }

  return response.json();
}

/** One page of a browsable category — the listing behind a row's "View more". */
export async function browseManga(
  category: MangaCategory,
  { limit, offset }: { limit: number; offset: number },
  signal?: AbortSignal,
): Promise<Paginated<MangaSummary>> {
  const response = await fetch(
    `${API_URL}/api/manga/browse/${category}?limit=${limit}&offset=${offset}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Unable to load manga."));
  }

  return response.json();
}

/** A manga's chapters, oldest first. MangaDex caps a page at 100. */
export async function getChapters(
  mangaId: string,
  { limit, offset }: { limit: number; offset: number },
  signal?: AbortSignal,
): Promise<Paginated<Chapter>> {
  const response = await fetch(
    `${API_URL}/api/manga/${encodeURIComponent(mangaId)}/chapters?limit=${limit}&offset=${offset}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(await errorMessage(response, "Unable to load chapters."));
  }

  return response.json();
}

/**
 * Page images for one chapter.
 *
 * Resolved when the reader opens, never cached — MangaDex hands out a
 * short-lived node per chapter and the URLs stop working.
 */
export async function getChapterPages(
  chapterId: string,
  signal?: AbortSignal,
): Promise<ChapterPages> {
  const response = await fetch(
    `${API_URL}/api/chapters/${encodeURIComponent(chapterId)}/pages`,
    { signal },
  );

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Unable to load this chapter."),
    );
  }

  return response.json();
}

/* ------------------------------------------------------------------ *
 * Accounts.
 *
 * The phone has no cookie jar worth relying on, so it holds the session token
 * itself (see `auth-storage.ts`) and sends it as a bearer. The API accepts
 * either that or a cookie, so these hit exactly the same routes the web app
 * does.
 * ------------------------------------------------------------------ */

async function authRequest(
  path: "register" | "login",
  body: Record<string, string>,
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/api/auth/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      await errorMessage(response, "Something went wrong. Try again."),
    );
  }

  return response.json();
}

export function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  return authRequest("register", input);
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return authRequest("login", input);
}

/** The user behind a stored token, or null when it has expired or been revoked. */
export async function getMe(token: string): Promise<User | null> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { authorization: `Bearer ${token}` },
  });

  return response.ok ? response.json() : null;
}

/**
 * Revokes the session server-side. Failures are the caller's to ignore — the
 * local token is cleared either way, because the user asked to sign out.
 */
export async function logout(token: string): Promise<void> {
  await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
}
