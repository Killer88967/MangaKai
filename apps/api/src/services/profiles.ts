import { eq, getDb, users } from "@mangakai/db";
import type { PublicProfile, User } from "@mangakai/shared";

const UNIQUE_VIOLATION = "23505";

export class UsernameTakenError extends Error {
  constructor() {
    super("That username is already taken.");
    this.name = "UsernameTakenError";
  }
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; current && depth < 4; depth++) {
    if (
      typeof current === "object" &&
      "code" in current &&
      current.code === UNIQUE_VIOLATION
    ) {
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function toPublicProfile(row: typeof users.$inferSelect): PublicProfile | null {
  if (!row.username) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

function toUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getPublicProfile(
  username: string,
): Promise<PublicProfile | null> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.username, normalizeUsername(username)))
    .limit(1);

  return row ? toPublicProfile(row) : null;
}

export async function updateProfile(
  userId: string,
  input: {
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
  },
): Promise<User> {
  try {
    const [row] = await getDb()
      .update(users)
      .set({
        username: normalizeUsername(input.username),
        displayName: input.displayName.trim(),
        bio: input.bio?.trim() || null,
        avatarUrl: input.avatarUrl?.trim() || null,
      })
      .where(eq(users.id, userId))
      .returning();

    if (!row) {
      throw new Error("User not found.");
    }

    return toUser(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new UsernameTakenError();
    }

    throw error;
  }
}
