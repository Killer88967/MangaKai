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
  listStaffPicks,
  removeStaffPick,
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
});

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

admin.get("/staff-picks", async (c) => c.json(await listStaffPicks()));

admin.post("/staff-picks", validateJson(staffPickInput), async (c) => {
  return c.json(await addStaffPick(c.req.valid("json")), 201);
});

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
