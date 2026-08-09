"use client";

import { useState } from "react";

interface ReaderPageProps {
  url: string;
  index: number;
  total: number;
  onExpired: () => void;
}

/**
 * One page of a chapter.
 *
 * Pointed at the MangaDex@Home node with a plain `<img>`, and deliberately not
 * fetched first.
 *
 * MangaDex@Home hotlink-protects its nodes: a request that looks like a browser
 * *and* carries an `Origin` header from a domain it does not allowlist is
 * answered with 404 — which, having no CORS headers, surfaces in the console as
 * "No 'Access-Control-Allow-Origin' header is present". `fetch()` always sends
 * `Origin`; `<img src>` sends none, so it is served normally. `localhost` is
 * allowlisted, which is why fetching worked in local development and failed
 * everywhere else.
 *
 * The cost is that we can no longer measure bytes and duration, so the web app
 * does not report retrievals to MangaDex@Home. The Expo reader cannot either —
 * `expo-image` exposes no metrics — so both clients are now honest about it
 * rather than one being quietly broken.
 *
 * `next/image` is still not used: the host changes every chapter, and running
 * someone else's already-optimised page scans through our optimiser would cost
 * bandwidth and gain nothing.
 */
export function ReaderPage({ url, index, total, onExpired }: ReaderPageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="min-h-40 w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Page ${index + 1} of ${total}`}
        // Native lazy loading replaces the IntersectionObserver this component
        // used to run: a 90-page chapter must not fetch every image at once.
        loading="lazy"
        decoding="async"
        onLoad={() => setFailed(false)}
        onError={() => {
          setFailed(true);
          // An `<img>` error exposes no status code, so a page that stops
          // loading is treated as the 15 minute host guarantee having run out —
          // the reader re-resolves the chapter, exactly as the Expo one does.
          onExpired();
        }}
        className={`mx-auto block h-auto w-full max-w-3xl ${failed ? "hidden" : ""}`}
      />
      {failed && (
        <div className="mx-auto flex aspect-2/3 w-full max-w-3xl items-center justify-center bg-white/4 text-sm text-zinc-500">
          Page failed to load
        </div>
      )}
    </div>
  );
}
