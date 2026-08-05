import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import admin from "./routes/admin";
import banners from "./routes/banners";
import chapters from "./routes/chapters";
import home from "./routes/home";
import manga from "./routes/manga";

const app = new Hono();

// The web app proxies through Next so it is same-origin; Expo is not.
app.use("/api/*", cors());

app.get("/", (c) => {
  return c.json({
    name: "MangaKai API",
    status: "online",
  });
});

app.route("/api/home", home);
app.route("/api/manga", manga);
app.route("/api/chapters", chapters);
app.route("/api/banners", banners);
app.route("/admin", admin);

if (process.env.NODE_ENV !== "test") {
  serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) });
}

export default app;
