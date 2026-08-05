import { Hono } from "hono";
import { serve } from "@hono/node-server";
import manga from "./routes/manga";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    name: "MangaKai API",
    status: "online",
  });
});

app.route("/api/manga", manga);

if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) });
}

export default app;
