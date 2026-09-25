import { Hono } from "hono";
import { MANGA_CATEGORIES, type MangaCategory } from "@mangakai/shared";
import { getChapters } from "../services/chapters";
import {
  browseManga,
  getMangaById,
  getMangaCoverImage,
  searchManga,
} from "../services/manga";

/** MangaDex caps a feed page at 100, and a chapter list wants them all. */
const CHAPTER_LIMIT = 100;

function isCategory(value: string | undefined): value is MangaCategory {
  return MANGA_CATEGORIES.includes(value as MangaCategory);
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads a non-negative integer query param, falling back when absent or junk. */
function intParam(value: string | undefined, fallback: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) return fallback;

  return Math.min(parsed, max);
}

const manga = new Hono();

manga.get("/search", async (c) => {
  const query = c.req.query("q")?.trim();

  if (!query) {
    return c.json({ error: "Missing search query." }, 400);
  }

  const limit = intParam(c.req.query("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  const offset = intParam(c.req.query("offset"), 0, 10_000);

  try {
    return c.json(await searchManga(query, { limit, offset }));
  } catch (error) {
    console.error("MangaDex search failed", error);
    return c.json({ error: "Unable to search manga right now." }, 502);
  }
});

/**
 * Registered before `/:id`, or Hono would match "browse" as a manga id.
 */
manga.get("/browse/:category", async (c) => {
  const category = c.req.param("category");

  if (!isCategory(category)) {
    return c.json({ error: "Unknown category." }, 400);
  }

  const limit = intParam(c.req.query("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  const offset = intParam(c.req.query("offset"), 0, 10_000);

  try {
    return c.json(await browseManga(category, { limit, offset }));
  } catch (error) {
    console.error("MangaDex browse failed", error);
    return c.json({ error: "Unable to load manga right now." }, 502);
  }
});

manga.get("/:id/chapters", async (c) => {
  const id = c.req.param("id");

  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "Invalid manga id." }, 400);
  }

  const limit = intParam(c.req.query("limit"), CHAPTER_LIMIT, CHAPTER_LIMIT);
  const offset = intParam(c.req.query("offset"), 0, 10_000);

  try {
    return c.json(await getChapters(id, { limit, offset }));
  } catch (error) {
    console.error("Failed to fetch chapters", error);
    return c.json({ error: "Unable to load chapters." }, 502);
  }
});

manga.get("/:id/cover", async (c) => {
  const id = c.req.param("id");

  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "Invalid manga id." }, 400);
  }

  try {
    const response = await getMangaCoverImage(id);
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to fetch manga cover", error);

    return c.json({ error: "Unable to load manga cover." }, 502);
  }
});

manga.get("/:id", async (c) => {
  const id = c.req.param("id");

  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "Invalid manga id." }, 400);
  }

  try {
    return c.json(await getMangaById(id));
  } catch (error) {
    console.error("Failed to fetch manga", error);

    return c.json({ error: "Unable to load manga." }, 502);
  }
});

export default manga;
