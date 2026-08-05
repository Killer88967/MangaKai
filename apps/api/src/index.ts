import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    name: "MangaKai API",
    status: "online",
  });
});

export default app;