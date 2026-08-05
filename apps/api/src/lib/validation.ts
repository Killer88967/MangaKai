import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

/**
 * zValidator's default failure response returns a raw ZodError. Everything
 * else in the API answers with `{ error: string }`, so this flattens issues
 * into that shape and keeps one error contract for clients to parse.
 */
export function validateJson<T extends ZodType>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (result.success) return;

    const message = result.error.issues
      .map((issue) => {
        const field = issue.path.join(".");

        return field ? `${field}: ${issue.message}` : issue.message;
      })
      .join("; ");

    return c.json({ error: message }, 400);
  });
}
