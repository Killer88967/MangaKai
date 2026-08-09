import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

/**
 * Where the session token lives for each client.
 *
 * The browser gets an httpOnly cookie it cannot read, so an XSS bug cannot
 * steal the session, and Next can read it during SSR — the page renders
 * signed-in instead of flipping after hydration. Expo has no cookie jar worth
 * relying on, so the phone keeps the token itself and sends it as a bearer.
 *
 * One reader handles both, so every route works for either client.
 */
export const SESSION_COOKIE = "mk_session";

const BEARER = "Bearer ";

export function readSessionToken(c: Context): string | null {
  const cookie = getCookie(c, SESSION_COOKIE);

  if (cookie) return cookie;

  const header = c.req.header("authorization") ?? "";

  return header.startsWith(BEARER) ? header.slice(BEARER.length) : null;
}

export function setSessionCookie(c: Context, token: string, expiresAt: Date) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    // Lax, not Strict: Strict withholds the cookie when someone arrives by
    // following a link from elsewhere, so they would land logged out.
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
