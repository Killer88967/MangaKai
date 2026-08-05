import { asc, eq, getDb, staffPicks } from "@mangakai/db";
import type { AdminStaffPick, StaffPick } from "@mangakai/shared";
import { getMangaSummariesByIds } from "./manga";

type StaffPickRow = typeof staffPicks.$inferSelect;

/** Position first, then insertion order, so equal positions stay predictable. */
const PICK_ORDER = [asc(staffPicks.position), asc(staffPicks.createdAt)];

function toAdminStaffPick(
  row: StaffPickRow,
  title: string | null,
): AdminStaffPick {
  return {
    id: row.id,
    mangaId: row.mangaId,
    title,
    note: row.note,
    position: row.position,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Staff picks are MangaKai rows holding a MangaDex id plus our own note. The
 * manga itself is fetched from MangaDex at read time and never stored, so a
 * retitled or re-covered series stays correct here for free.
 *
 * Only published picks reach the homepage.
 */
export async function listStaffPicks(): Promise<StaffPick[]> {
  const rows = await getDb()
    .select()
    .from(staffPicks)
    .where(eq(staffPicks.active, true))
    .orderBy(...PICK_ORDER);

  if (rows.length === 0) return [];

  const manga = await getMangaSummariesByIds(rows.map((row) => row.mangaId));

  // A pick whose manga MangaDex no longer returns is dropped rather than
  // rendered as a hole in the row.
  return rows.flatMap((row) => {
    const summary = manga.get(row.mangaId);

    return summary ? [{ manga: summary, note: row.note }] : [];
  });
}

/**
 * Every pick, drafts included.
 *
 * Unlike the public list this keeps picks MangaDex cannot resolve — an admin
 * needs to see a broken pick to fix it, where a visitor should never meet one.
 */
export async function listAllStaffPicks(): Promise<AdminStaffPick[]> {
  const rows = await getDb()
    .select()
    .from(staffPicks)
    .orderBy(...PICK_ORDER);

  if (rows.length === 0) return [];

  const manga = await getMangaSummariesByIds(rows.map((row) => row.mangaId));

  return rows.map((row) =>
    toAdminStaffPick(row, manga.get(row.mangaId)?.title ?? null),
  );
}

export async function addStaffPick(input: {
  mangaId: string;
  note?: string | null;
  position?: number;
  active?: boolean;
}) {
  const [row] = await getDb()
    .insert(staffPicks)
    .values(input)
    .onConflictDoUpdate({
      target: staffPicks.mangaId,
      set: {
        note: input.note ?? null,
        position: input.position ?? 0,
        active: input.active ?? true,
      },
    })
    .returning();

  return row!;
}

/** Returns null when no pick holds that manga id. */
export async function updateStaffPick(
  mangaId: string,
  patch: { note?: string | null; position?: number; active?: boolean },
): Promise<AdminStaffPick | null> {
  const [row] = await getDb()
    .update(staffPicks)
    .set(patch)
    .where(eq(staffPicks.mangaId, mangaId))
    .returning();

  if (!row) return null;

  const manga = await getMangaSummariesByIds([row.mangaId]);

  return toAdminStaffPick(row, manga.get(row.mangaId)?.title ?? null);
}

export async function removeStaffPick(mangaId: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(staffPicks)
    .where(eq(staffPicks.mangaId, mangaId))
    .returning({ id: staffPicks.id });

  return deleted.length > 0;
}

/**
 * Moves a pick to a position and renumbers the rest so positions stay
 * contiguous from zero.
 *
 * Without renumbering you end up with several picks claiming position 0 and
 * the homepage order decided by an arbitrary tiebreak.
 */
export async function moveStaffPick(
  mangaId: string,
  position: number,
): Promise<AdminStaffPick[] | null> {
  return getDb().transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(staffPicks)
      .orderBy(...PICK_ORDER);
    const moving = rows.find((row) => row.mangaId === mangaId);

    if (!moving) return null;

    const ordered = rows.filter((row) => row.mangaId !== mangaId);
    // Clamp rather than reject: "move it to the end" is a reasonable thing to
    // ask for without knowing how many picks there are.
    const target = Math.max(0, Math.min(position, ordered.length));

    ordered.splice(target, 0, moving);

    for (const [index, row] of ordered.entries()) {
      await tx
        .update(staffPicks)
        .set({ position: index })
        .where(eq(staffPicks.id, row.id));
    }

    const manga = await getMangaSummariesByIds(
      ordered.map((row) => row.mangaId),
    );

    return ordered.map((row, index) =>
      toAdminStaffPick(
        { ...row, position: index },
        manga.get(row.mangaId)?.title ?? null,
      ),
    );
  });
}

/**
 * Replaces the manga behind a pick, keeping its slot and active state.
 *
 * The note is cleared unless a replacement is supplied: an editorial note
 * written about one series is wrong about another, and silently carrying it
 * over would put words in the staff's mouth.
 */
export async function switchStaffPick(
  fromMangaId: string,
  toMangaId: string,
  note?: string | null,
): Promise<AdminStaffPick | null> {
  return getDb().transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(staffPicks)
      .where(eq(staffPicks.mangaId, fromMangaId));

    if (!existing) return null;

    const [row] = await tx
      .update(staffPicks)
      .set({ mangaId: toMangaId, note: note ?? null })
      .where(eq(staffPicks.id, existing.id))
      .returning();

    const manga = await getMangaSummariesByIds([toMangaId]);

    return toAdminStaffPick(row!, manga.get(toMangaId)?.title ?? null);
  });
}
