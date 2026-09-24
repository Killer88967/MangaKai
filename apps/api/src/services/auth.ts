import { createHash, randomBytes } from "node:crypto";
import {
  and,
  eq,
  getDb,
  gte,
  lte,
  sessions,
  users,
  type UserRow,
} from "@mangakai/db";
import type { AuthResponse, User } from "@mangakai/shared";
import { burnVerifyTime, hashPassword, verifyPassword } from "../lib/password";

/** How long a session lasts before the user has to sign in again. */
const SESSION_DAYS = 30;

/** Raised when registration hits the unique index on `users.email`. */
export class EmailTakenError extends Error {
  constructor() {
    super("That email is already registered.");
    this.name = "EmailTakenError";
  }
}

/**
 * Postgres' unique-violation code. Registration checks for it rather than
 * SELECTing first: two requests for the same new email can both pass a check
 * and then collide, and only the constraint is actually race-free.
 */
const UNIQUE_VIOLATION = "23505";

/**
 * Drizzle wraps driver errors, so the Postgres error code is not on the thrown
 * object — it sits on `.cause` as a `PostgresError`. Walking the chain rather
 * than reaching for `error.cause.code` keeps this working if another layer is
 * ever added in between.
 */
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

/**
 * Lowercased and trimmed, always, before it reaches the database.
 *
 * The unique index applies to the stored value, so normalising at the edge is
 * what stops `Ernie@x.com` and `ernie@x.com` becoming two accounts.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Never returns the password hash — this is what goes over the wire. */
function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * The database stores a SHA-256 of the session token, never the token.
 *
 * A stolen dump then contains nothing that grants access. SHA-256 rather than
 * scrypt is right here: the token is 32 random bytes, so there is no low-entropy
 * guess to slow down, and this runs on every authenticated request.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Mints a session and returns the parts the client needs.
 *
 * `expiresAt` is computed once and both stored and returned, so what the client
 * believes and what the database enforces cannot drift apart.
 */
async function issueSession(
  row: UserRow,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await getDb()
    .insert(sessions)
    .values({
      userId: row.id,
      tokenHash: hashToken(token),
      expiresAt,
    });

  return { token, expiresAt };
}

async function sessionResponse(row: UserRow): Promise<AuthResponse> {
  const { token, expiresAt } = await issueSession(row);

  return { user: toUser(row), token, expiresAt: expiresAt.toISOString() };
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthResponse> {
  const passwordHash = await hashPassword(input.password);

  try {
    const [row] = await getDb()
      .insert(users)
      .values({
        email: normalizeEmail(input.email),
        passwordHash,
        displayName: input.displayName.trim(),
      })
      .returning();

    return await sessionResponse(row!);
  } catch (error) {
    if (isUniqueViolation(error)) throw new EmailTakenError();

    throw error;
  }
}

/**
 * Null when the email is unknown *or* the password is wrong — the caller must
 * not distinguish them, or the response tells an attacker which addresses have
 * accounts.
 */
export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse | null> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(input.email)))
    .limit(1);

  // No account: still spend the time a real verify would, so the two failures
  // are indistinguishable by how long they take.
  if (!row) {
    await burnVerifyTime(input.password);

    return null;
  }

  if (!(await verifyPassword(input.password, row.passwordHash))) return null;

  // Expired rows still occupy the unique index, and nothing else ever removes
  // them. Signing in is the natural moment to clear this user's — it is the one
  // place we already know the user id, and the index on it makes this cheap.
  await getDb()
    .delete(sessions)
    .where(
      and(eq(sessions.userId, row.id), lte(sessions.expiresAt, new Date())),
    );

  return sessionResponse(row);
}

/** The user behind a session token, or null if it is unknown or expired. */
export async function getUserBySession(token: string): Promise<User | null> {
  const [row] = await getDb()
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        gte(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return row ? toUser(row.user) : null;
}

/**
 * Logs one device out. Deleting the row is what makes this immediate — the
 * whole reason sessions live in the database rather than in a signed token.
 */
export async function destroySession(token: string): Promise<void> {
  await getDb()
    .delete(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)));
}
