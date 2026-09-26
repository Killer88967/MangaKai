import { Hono } from "hono";
import { z } from "zod";
import { validateJson } from "../lib/validation";
import { requireUser, type UserVariables } from "../middleware/user";
import {
  getPublicProfile,
  updateProfile,
  UsernameTakenError,
} from "../services/profiles";

const usersRoute = new Hono<UserVariables>();

const USERNAME_PATTERN = /^[a-z0-9_]+$/;

const profileUpdate = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Usernames must be at least 3 characters.")
    .max(24, "Usernames are 24 characters at most.")
    .transform((value) => value.toLowerCase())
    .refine(
      (value) => USERNAME_PATTERN.test(value),
      "Use only letters, numbers, and underscores.",
    ),

  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(50, "Display names are 50 characters at most."),

  bio: z
    .string()
    .trim()
    .max(300, "Bios are 300 characters at most.")
    .nullable(),

  avatarUrl: z
    .union([z.url("Enter a valid avatar URL."), z.literal(""), z.null()])
    .transform((value) => value || null),
});

usersRoute.patch(
  "/me/profile",
  requireUser,
  validateJson(profileUpdate),
  async (c) => {
    const currentUser = c.get("user");

    try {
      const user = await updateProfile(currentUser.id, c.req.valid("json"));

      return c.json(user);
    } catch (error) {
      if (error instanceof UsernameTakenError) {
        return c.json({ error: error.message }, 409);
      }

      console.error("Failed to update profile", error);

      return c.json({ error: "Unable to update your profile." }, 500);
    }
  },
);

usersRoute.get("/:username", async (c) => {
  const username = c.req.param("username").trim().toLowerCase();

  if (
    username.length < 3 ||
    username.length > 24 ||
    !USERNAME_PATTERN.test(username)
  ) {
    return c.json({ error: "Profile not found." }, 404);
  }

  try {
    const profile = await getPublicProfile(username);

    if (!profile) {
      return c.json({ error: "Profile not found." }, 404);
    }

    return c.json(profile);
  } catch (error) {
    console.error("Failed to load profile", error);

    return c.json({ error: "Unable to load this profile." }, 500);
  }
});

export default usersRoute;
