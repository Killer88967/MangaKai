import { Hono } from "hono";
import { z } from "zod";
import { validateJson } from "../lib/validation";
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from "../lib/session-cookie";
import { requireUser, type UserVariables } from "../middleware/user";
import {
  EmailTakenError,
  destroySession,
  loginUser,
  registerUser,
} from "../services/auth";

/**
 * Accounts. Mounted at `/api/auth` rather than `/auth` on purpose: the web app
 * reaches the API through a Next rewrite that only forwards `/api/*`, so
 * anything outside it would be a cross-origin request and the session cookie
 * would not be sent.
 */
const authRoute = new Hono<UserVariables>();

/**
 * 8 characters is the floor, with no composition rules — length is what
 * actually resists guessing, and forcing symbols mostly produces `Password1!`.
 * The cap is scrypt's problem, not the user's: an unbounded password is free
 * CPU for an attacker.
 */
const password = z.string().min(8, "Use at least 8 characters.").max(200);

const credentials = z.object({
  // Trim before validating, not after: people paste addresses with a trailing
  // space, and `z.email()` rejects that outright. The service lowercases and
  // trims again on the way to the database.
  email: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email address.").max(254)),
  password,
});

const registration = credentials.extend({
  displayName: z
    .string()
    .trim()
    .min(1, "Pick a display name.")
    .max(50, "Display names are 50 characters at most."),
});

authRoute.post("/register", validateJson(registration), async (c) => {
  const input = c.req.valid("json");

  try {
    const auth = await registerUser(input);

    setSessionCookie(c, auth.token, new Date(auth.expiresAt));

    return c.json(auth, 201);
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return c.json({ error: error.message }, 409);
    }

    console.error("Failed to register", error);

    return c.json({ error: "Unable to create your account." }, 500);
  }
});

authRoute.post("/login", validateJson(credentials), async (c) => {
  try {
    const auth = await loginUser(c.req.valid("json"));

    // One message for both "no such account" and "wrong password". Saying which
    // would confirm to an attacker that an address is registered.
    if (!auth) {
      return c.json({ error: "Invalid email or password." }, 401);
    }

    setSessionCookie(c, auth.token, new Date(auth.expiresAt));

    return c.json(auth);
  } catch (error) {
    console.error("Failed to log in", error);

    return c.json({ error: "Unable to sign you in." }, 500);
  }
});

/**
 * Always 204, even without a valid session — "log me out" has no failure worth
 * reporting, and a client that has already lost its token still needs the
 * cookie cleared.
 */
authRoute.post("/logout", async (c) => {
  const token = readSessionToken(c);

  try {
    if (token) await destroySession(token);
  } catch (error) {
    console.error("Failed to destroy session", error);
  }

  clearSessionCookie(c);

  return c.body(null, 204);
});

authRoute.get("/me", requireUser, (c) => c.json(c.get("user")));

export default authRoute;
