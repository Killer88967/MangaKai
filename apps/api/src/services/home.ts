import type { HomePage } from "@mangakai/shared";
import { listActiveBanners } from "./banners";
import { getLatestUpdates, getPopularManga, getRecentlyAdded } from "./manga";
import { listStaffPicks } from "./staff-picks";

const ROW_SIZE = 12;

/**
 * The homepage is the whole point of the API sitting in the middle: MangaKai's
 * banners and staff picks are merged with MangaDex rows into one response, so
 * web and mobile each make a single request.
 */
export async function getHomePage(): Promise<HomePage> {
  const [banners, staffPicks, popular, latestUpdates, recentlyAdded] =
    await Promise.all([
      listActiveBanners(),
      listStaffPicks(),
      getPopularManga(ROW_SIZE),
      getLatestUpdates(ROW_SIZE),
      getRecentlyAdded(ROW_SIZE),
    ]);

  return {
    banners,
    // The most followed series doubles as the hero until an admin can pin one.
    hero: popular[0] ?? null,
    staffPicks,
    popular,
    latestUpdates,
    recentlyAdded,
  };
}
