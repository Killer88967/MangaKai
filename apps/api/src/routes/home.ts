import { Hono } from "hono";
import { getHomePage } from "../services/home";

const home = new Hono();

home.get("/", async (c) => {
  try {
    return c.json(await getHomePage());
  } catch (error) {
    console.error("Failed to build homepage", error);

    return c.json({ error: "Unable to load the homepage." }, 502);
  }
});

export default home;
