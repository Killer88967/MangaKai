import { Hono } from "hono";
import { searchManga, getManga } from "@mangakai/mangadex";

const manga = new Hono();

manga.get("/search", async (c) => {
  const query = c.req.query("q")?.trim();

  if (!query) {
    return c.json({ error: "Missing search query." }, 400);
  }

  try {
    const results = await searchManga({ title: query });

    return c.json(results);
  } catch (error) {
    console.error("MangaDex search failed", error);
    return c.json({ error: "Unable to search manga right now." }, 502);
  }
});

manga.get("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const result = await getManga(id);

    return c.json(result);
  } catch (error) {
    console.error("Failed to fetch manga", error);

    return c.json({ error: "Unable to load manga." }, 502);
  }
});

export default manga;
