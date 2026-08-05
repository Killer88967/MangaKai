import {
  and,
  banners,
  desc,
  eq,
  getDb,
  gte,
  isNull,
  lte,
  or,
  type BannerRow,
} from "@mangakai/db";
import type { AdminBanner, Banner } from "@mangakai/shared";

/** Strips scheduling and draft state — visitors only see what is live. */
function toBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    linkLabel: row.linkLabel,
    variant: row.variant,
  };
}

function toAdminBanner(row: BannerRow): AdminBanner {
  return {
    ...toBanner(row),
    active: row.active,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** A banner is live when it is active and inside its scheduling window. */
export async function listActiveBanners(now = new Date()): Promise<Banner[]> {
  const rows = await getDb()
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.active, true),
        or(isNull(banners.startsAt), lte(banners.startsAt, now)),
        or(isNull(banners.endsAt), gte(banners.endsAt, now)),
      ),
    )
    .orderBy(desc(banners.createdAt));

  return rows.map(toBanner);
}

export async function listAllBanners(): Promise<AdminBanner[]> {
  const rows = await getDb()
    .select()
    .from(banners)
    // Live banners first, newest first within each group.
    .orderBy(desc(banners.active), desc(banners.createdAt));

  return rows.map(toAdminBanner);
}

export interface BannerInput {
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  variant?: Banner["variant"];
  active?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export async function createBanner(input: BannerInput): Promise<AdminBanner> {
  const [row] = await getDb().insert(banners).values(input).returning();

  return toAdminBanner(row!);
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>,
): Promise<AdminBanner | null> {
  const [row] = await getDb()
    .update(banners)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(banners.id, id))
    .returning();

  return row ? toAdminBanner(row) : null;
}

export async function deleteBanner(id: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(banners)
    .where(eq(banners.id, id))
    .returning({ id: banners.id });

  return deleted.length > 0;
}
