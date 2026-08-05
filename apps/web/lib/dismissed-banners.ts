/**
 * Dismissals live in a cookie rather than localStorage so the server can read
 * them too. That lets the root layout filter banners during SSR, so the bar is
 * in the initial HTML instead of appearing after hydration and shoving the
 * page down.
 */
export const DISMISSED_COOKIE = "mangakai_dismissed_banners";

/** Banner ids are UUIDs, so a comma-separated list needs no escaping. */
const SEPARATOR = ",";

/** Keeps the cookie small; older dismissals fall off the end. */
const MAX_REMEMBERED = 20;

export function parseDismissed(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(SEPARATOR)
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(-MAX_REMEMBERED);
}

export function serializeDismissed(ids: string[]): string {
  return [...new Set(ids)].slice(-MAX_REMEMBERED).join(SEPARATOR);
}
