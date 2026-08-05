import { createMiddleware } from "hono/factory";

/**
 * Stopgap admin gate: a shared secret in ADMIN_TOKEN.
 *
 * This exists so admin endpoints are never open while the real user system is
 * still being built. When sessions and roles land, replace the body of this
 * middleware with a role check — every /admin route already goes through it.
 */
export const requireAdmin = createMiddleware(async (c, next) => {
  const expected = process.env.ADMIN_TOKEN;

  if (!expected) {
    console.error("ADMIN_TOKEN is not set; refusing all admin requests.");
    return c.json({ error: "Admin access is not configured." }, 503);
  }

  const header = c.req.header("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (provided !== expected) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  await next();
});
