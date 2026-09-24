import { createMiddleware } from "hono/factory";
import { resolveUser, type UserVariables } from "./user";

/**
 * Restricts `/api/admin/*` to MangaKai administrators.
 *
 * Admin access uses the same database-backed session as the rest of MangaKai,
 * rather than a separate shared secret. Changing a user's role therefore takes
 * effect on their next authenticated request without issuing a special token.
 */
export const requireAdmin = createMiddleware<UserVariables>(async (c, next) => {
  const user = await resolveUser(c);

  if (!user) {
    return c.json({ error: "You need to be signed in." }, 401);
  }

  if (user.role !== "admin") {
    return c.json({ error: "Administrator access required." }, 403);
  }

  c.set("user", user);

  await next();
});
