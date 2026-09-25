import { desc, eq, getDb, users } from "@mangakai/db";
import type { AdminUser, UserRole } from "@mangakai/shared";

function toAdminUser(row: typeof users.$inferSelect): AdminUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Newest MangaKai accounts first. */
export async function listUsers(): Promise<AdminUser[]> {
  const rows = await getDb()
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  return rows.map(toAdminUser);
}

export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<AdminUser | null> {
  const [row] = await getDb()
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning();

  return row ? toAdminUser(row) : null;
}
