import { Hono } from "hono";
import { BANNER_VARIANTS } from "@mangakai/shared";
import { z } from "zod";
import { publish } from "../lib/events";
import { validateJson } from "../lib/validation";
import { requireAdmin } from "../middleware/admin";
import {
  createBanner,
  deleteBanner,
  listAllBanners,
  updateBanner,
} from "../services/banners";
import {
  addStaffPick,
  listAllStaffPicks,
  moveStaffPick,
  removeStaffPick,
  switchStaffPick,
  updateStaffPick,
} from "../services/staff-picks";

const UUID = z.string().uuid();
const nullableText = z.string().trim().min(1).nullish();
const scheduledAt = z.coerce.date().nullish();

const bannerInput = z.object({
  title: z.string().trim().min(1).max(120),
  body: nullableText,
  imageUrl: z.string().url().nullish(),
  linkUrl: z.string().url().nullish(),
  linkLabel: nullableText,
  variant: z.enum(BANNER_VARIANTS).optional(),
  active: z.boolean().optional(),
  startsAt: scheduledAt,
  endsAt: scheduledAt,
});

/** Every field optional, but reject `{}` so a no-op PATCH is an obvious 400. */
const bannerPatch = bannerInput
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

const staffPickInput = z.object({
  mangaId: UUID,
  note: nullableText,
  position: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

/** Refuses an empty body, which would otherwise report success and change nothing. */
const staffPickPatch = z
  .object({
    note: nullableText,
    position: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (patch) => Object.keys(patch).length > 0,
    "Provide at least one field to update.",
  );

const staffPickSwitch = z.object({
  from: UUID,
  to: UUID,
  note: nullableText,
});

const staffPickMove = z.object({ position: z.number().int().min(0) });

const admin = new Hono();

admin.use("*", requireAdmin);

admin.get("/banners", async (c) => c.json(await listAllBanners()));

admin.post("/banners", validateJson(bannerInput), async (c) => {
  const banner = await createBanner(c.req.valid("json"));

  publish({ type: "banners:changed" });

  return c.json(banner, 201);
});

admin.patch("/banners/:id", validateJson(bannerPatch), async (c) => {
  const id = c.req.param("id");

  if (!UUID.safeParse(id).success) {
    return c.json({ error: "Invalid banner id." }, 400);
  }

  const banner = await updateBanner(id, c.req.valid("json"));

  if (!banner) return c.json({ error: "Banner not found." }, 404);

  publish({ type: "banners:changed" });

  return c.json(banner);
});

admin.delete("/banners/:id", async (c) => {
  const id = c.req.param("id");

  if (!UUID.safeParse(id).success) {
    return c.json({ error: "Invalid banner id." }, 400);
  }

  if (!(await deleteBanner(id))) {
    return c.json({ error: "Banner not found." }, 404);
  }

  publish({ type: "banners:changed" });

  return c.body(null, 204);
});

admin.get("/staff-picks", async (c) => c.json(await listAllStaffPicks()));

admin.post("/staff-picks", validateJson(staffPickInput), async (c) => {
  return c.json(await addStaffPick(c.req.valid("json")), 201);
});

/**
 * Registered before the `/:mangaId` handlers so "switch" is not read as an id.
 */
admin.post("/staff-picks/switch", validateJson(staffPickSwitch), async (c) => {
  const { from, to, note } = c.req.valid("json");
  const pick = await switchStaffPick(from, to, note);

  if (!pick) return c.json({ error: "Staff pick not found." }, 404);

  return c.json(pick);
});

admin.patch(
  "/staff-picks/:mangaId",
  validateJson(staffPickPatch),
  async (c) => {
    const mangaId = c.req.param("mangaId");

    if (!UUID.safeParse(mangaId).success) {
      return c.json({ error: "Invalid manga id." }, 400);
    }

    const pick = await updateStaffPick(mangaId, c.req.valid("json"));

    if (!pick) return c.json({ error: "Staff pick not found." }, 404);

    return c.json(pick);
  },
);

admin.post(
  "/staff-picks/:mangaId/move",
  validateJson(staffPickMove),
  async (c) => {
    const mangaId = c.req.param("mangaId");

    if (!UUID.safeParse(mangaId).success) {
      return c.json({ error: "Invalid manga id." }, 400);
    }

    const picks = await moveStaffPick(mangaId, c.req.valid("json").position);

    if (!picks) return c.json({ error: "Staff pick not found." }, 404);

    return c.json(picks);
  },
);

admin.delete("/staff-picks/:mangaId", async (c) => {
  const mangaId = c.req.param("mangaId");

  if (!UUID.safeParse(mangaId).success) {
    return c.json({ error: "Invalid manga id." }, 400);
  }

  if (!(await removeStaffPick(mangaId))) {
    return c.json({ error: "Staff pick not found." }, 404);
  }

  return c.body(null, 204);
});

export default admin;
