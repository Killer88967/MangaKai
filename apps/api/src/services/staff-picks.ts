import { asc, eq, getDb, staffPicks } from "@mangakai/db";
import type { StaffPick } from "@mangakai/shared";
import { getMangaSummariesByIds } from "./manga";

/**
 * Staff picks are MangaKai rows holding a MangaDex id plus our own note. The
 * manga itself is fetched from MangaDex at read time and never stored, so a
 * retitled or re-covered series stays correct here for free.
 */
export async function listStaffPicks(): Promise<StaffPick[]> {
  const rows = await getDb()
    .select()
    .from(staffPicks)
    .orderBy(asc(staffPicks.position), asc(staffPicks.createdAt));

  if (rows.length === 0) return [];

  const manga = await getMangaSummariesByIds(rows.map((row) => row.mangaId));

  // A pick whose manga MangaDex no longer returns is dropped rather than
  // rendered as a hole in the row.
  return rows.flatMap((row) => {
    const summary = manga.get(row.mangaId);

    return summary ? [{ manga: summary, note: row.note }] : [];
  });
}

export async function addStaffPick(input: {
  mangaId: string;
  note?: string | null;
  position?: number;
}) {
  const [row] = await getDb()
    .insert(staffPicks)
    .values(input)
    .onConflictDoUpdate({
      target: staffPicks.mangaId,
      set: { note: input.note ?? null, position: input.position ?? 0 },
    })
    .returning();

  return row!;
}

export async function removeStaffPick(mangaId: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(staffPicks)
    .where(eq(staffPicks.mangaId, mangaId))
    .returning({ id: staffPicks.id });

  return deleted.length > 0;
}
