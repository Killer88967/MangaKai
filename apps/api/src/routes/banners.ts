import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { subscribe } from "../lib/events";
import { listActiveBanners } from "../services/banners";

/** Keeps proxies from closing an idle stream. */
const KEEPALIVE_MS = 25_000;

const bannersRoute = new Hono();

bannersRoute.get("/", async (c) => {
  try {
    return c.json(await listActiveBanners());
  } catch (error) {
    console.error("Failed to list banners", error);
    return c.json({ error: "Unable to load banners." }, 500);
  }
});

/**
 * Live banner feed. Clients connect once and receive the full active set on
 * connect and again whenever an admin changes anything, so a POST from a
 * terminal shows up in an open browser tab without a refresh.
 */
bannersRoute.get("/stream", (c) => {
  // Compressing an event stream buffers it, so events never reach the client.
  // `no-transform` is the standards-based signal; the other two cover proxies
  // that ignore it (nginx honours X-Accel-Buffering).
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Content-Encoding", "identity");
  c.header("X-Accel-Buffering", "no");

  return streamSSE(c, async (stream) => {
    let open = true;

    const send = async () => {
      try {
        await stream.writeSSE({
          event: "banners",
          data: JSON.stringify(await listActiveBanners()),
        });
      } catch (error) {
        console.error("Failed to push banners", error);
      }
    };

    const unsubscribe = subscribe(() => {
      void send();
    });

    stream.onAbort(() => {
      open = false;
      unsubscribe();
    });

    await send();

    while (open) {
      await stream.sleep(KEEPALIVE_MS);
      if (!open) break;
      await stream.writeSSE({ event: "ping", data: "" });
    }
  });
});

export default bannersRoute;
