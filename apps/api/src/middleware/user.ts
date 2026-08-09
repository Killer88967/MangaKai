import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { User } from "@mangakai/shared";
import { readSessionToken } from "../lib/session-cookie";
import { getUserBySession } from "../services/auth";

/**
 * Route handlers read the signed-in user off the context rather than looking it
 * up a second time.
 */
export type UserVariables = {
  Variables: {
    user: User;
  };
};

export async function resolveUser(c: Context): Promise<User | null> {
  const token = readSessionToken(c);

  return token ? getUserBySession(token) : null;
}

/**
 * Rejects anyone without a live session.
 *
 * Both clients reach this the same way — cookie or bearer, see
 * `lib/session-cookie.ts` — so a protected route needs no per-client handling.
 */
export const requireUser = createMiddleware<UserVariables>(async (c, next) => {
  const user = await resolveUser(c);

  if (!user) {
    return c.json({ error: "You need to be signed in." }, 401);
  }

  c.set("user", user);

  await next();
});
