import type { Banner } from "@mangakai/shared";
import { fetch } from "expo/fetch";
import { useEffect, useState } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

/** Long enough not to hammer a restarting API, short enough to feel instant. */
const RECONNECT_MS = 3000;

/** Pulls `event:` and `data:` out of one SSE frame. */
function parseFrame(frame: string) {
  let event = "message";
  const data: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data.push(line.slice("data:".length).trim());
    }
  }

  return { event, data: data.join("\n") };
}

/**
 * Keeps the banner list in sync with the API without a refresh, so a
 * `pnpm banner new` from a terminal shows up on the phone straight away.
 *
 * React Native has no `EventSource`, so this reads the stream by hand.
 * `expo/fetch` is the WinterCG fetch that exposes `response.body` as a
 * `ReadableStream` — the built-in RN `fetch` buffers the whole response and
 * would never resolve on an endpoint that stays open.
 *
 * `initial` only seeds the first render. The stream sends the full active set
 * on connect, so it becomes authoritative within a second of mounting.
 */
export function useLiveBanners(initial: Banner[]) {
  const [banners, setBanners] = useState(initial);

  useEffect(() => {
    const controller = new AbortController();
    let reconnect: ReturnType<typeof setTimeout> | undefined;

    async function connect() {
      try {
        const response = await fetch(`${API_URL}/api/banners/stream`, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream responded ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // A chunk can hold several frames or half of one, so decode with
          // `stream` and only consume up to the last frame boundary.
          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const { event, data } = parseFrame(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);

            // Ignore the keepalive pings; they exist to hold the socket open.
            if (event === "banners" && data !== "") {
              try {
                setBanners(JSON.parse(data) as Banner[]);
              } catch {
                // A truncated frame is not worth tearing the stream down for.
              }
            }

            boundary = buffer.indexOf("\n\n");
          }
        }
      } catch {
        // Dropped connection, API restart, backgrounded app — all recoverable.
      }

      // Unmounting aborts, and that must not schedule another attempt.
      if (!controller.signal.aborted) {
        reconnect = setTimeout(connect, RECONNECT_MS);
      }
    }

    void connect();

    return () => {
      controller.abort();
      if (reconnect) clearTimeout(reconnect);
    };
  }, []);

  return banners;
}
