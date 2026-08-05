/**
 * In-process pub/sub backing the SSE stream.
 *
 * Good enough while the API runs as a single process. Running more than one
 * instance means swapping this for Postgres LISTEN/NOTIFY or Redis so a write
 * on one instance reaches clients connected to another — the publish/subscribe
 * shape below stays the same.
 */

export type PlatformEvent = { type: "banners:changed" };

type Listener = (event: PlatformEvent) => void;

const listeners = new Set<Listener>();

export function publish(event: PlatformEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error("Event listener failed", error);
    }
  }
}

/** Returns an unsubscribe function for the caller to run on disconnect. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}
