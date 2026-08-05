import { Hono } from "hono";
import { getMangaById, searchManga } from "../services/manga";

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
