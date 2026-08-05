import { Hono } from "hono";
import { z } from "zod";
import { validateJson } from "../lib/validation";
import { getChapterPages, reportPageLoad } from "../services/chapters";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Only MangaDex@Home nodes may be reported on.
 *
 * Without this we would relay arbitrary URLs to MangaDex under our name — an
 * open relay that could be used to poison their view of the network.
 */
const REPORTABLE_HOST = /(^|\.)mangadex\.network$/;

const pageReport = z.object({
  url: z.url().refine((value) => {
    // `new URL` throws on junk, and an exception here would surface as a 500
    // instead of the 400 a bad body deserves.
    try {
      return REPORTABLE_HOST.test(new URL(value).hostname);
    } catch {
      return false;
    }
  }, "Only MangaDex@Home URLs can be reported."),
  success: z.boolean(),
  cached: z.boolean(),
  bytes: z.number().int().nonnegative(),
  duration: z.number().int().nonnegative(),
});

const chapters = new Hono();

/**
 * Page images for one chapter.
 *
 * MangaDex hands out a short-lived node per chapter, so this is resolved when
 * the reader opens rather than cached with the chapter list. `no-store` keeps
 * anything in front of us from holding on to URLs that will stop working.
 */
chapters.get("/:id/pages", async (c) => {
  const id = c.req.param("id");

  if (!UUID_PATTERN.test(id)) {
    return c.json({ error: "Invalid chapter id." }, 400);
  }

  try {
    const pages = await getChapterPages(id);

    c.header("Cache-Control", "no-store");

    return c.json(pages);
  } catch (error) {
    console.error("Failed to resolve chapter pages", error);
    return c.json({ error: "Unable to load this chapter." }, 502);
  }
});

/**
 * Relays a page-load result to MangaDex@Home.
 *
 * Clients measure the fetch because only they perform it, but they must not
 * talk to MangaDex themselves, so it goes through here.
 *
 * Always answers 204. A failed report is our problem to log, not something a
 * reader can act on, and it must never surface as an error mid-chapter.
 */
chapters.post("/report", validateJson(pageReport), async (c) => {
  try {
    await reportPageLoad(c.req.valid("json"));
  } catch (error) {
    console.error("MangaDex@Home report failed", error);
  }

  return c.body(null, 204);
});

export default chapters;
