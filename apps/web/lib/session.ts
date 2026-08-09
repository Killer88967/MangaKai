import { cache } from "react";
import { cookies } from "next/headers";
import type { User } from "@mangakai/shared";

/**
 * The browser's half of a MangaKai session.
 *
 * The token lives in an httpOnly cookie, so page JavaScript cannot read it and
 * an XSS bug cannot steal the session. Server components read it here and pass
 * it to the API as a bearer token — the API accepts either, so the browser
 * never has to forward its own cookie header.
 *
 * Kept in sync with `apps/api/src/lib/session-cookie.ts` by name only; the API
 * sets the same cookie when it is called directly.
 */
export const SESSION_COOKIE = "mk_session";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

/**
 * The signed-in user, or null.
 *
 * `cache` dedupes this for one render pass, so the header and a page can both
 * ask without two round trips to the API.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    return response.ok ? await response.json() : null;
  } catch {
    // A signed-in user seeing the site as a guest is a far better failure than
    // the whole page erroring because the API is briefly unreachable.
    return null;
  }
});
