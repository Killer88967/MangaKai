import type { AdminBanner } from "@mangakai/shared";
import color from "picocolors";

export type BannerStatus = "live" | "draft" | "scheduled" | "expired";

/** Mirrors the liveness rule in `listActiveBanners` on the API. */
export function bannerStatus(
  banner: AdminBanner,
  now = new Date(),
): BannerStatus {
  if (!banner.active) return "draft";
  if (banner.startsAt && new Date(banner.startsAt) > now) return "scheduled";
  if (banner.endsAt && new Date(banner.endsAt) < now) return "expired";

  return "live";
}

const statusColors: Record<BannerStatus, (text: string) => string> = {
  live: color.green,
  draft: color.dim,
  scheduled: color.cyan,
  expired: color.yellow,
};

export function formatStatus(status: BannerStatus): string {
  return statusColors[status](status.padEnd(9));
}

/**
 * Accepts ISO 8601 or anything Date understands, but rejects bare numbers —
 * `1767225600` would be read as milliseconds and silently land in 1970.
 */
export function parseDate(value: string): Date | null {
  if (/^\d+$/.test(value.trim())) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
