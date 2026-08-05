"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Banner } from "@mangakai/shared";

const DISMISSED_KEY = "mangakai:dismissed-banners";

const variantStyles: Record<Banner["variant"], string> = {
  info: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  announcement: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
};

const variantLabels: Record<Banner["variant"], string> = {
  info: "Notice",
  announcement: "Announcement",
  warning: "Heads up",
};

/*
 * Dismissals live in localStorage, which React cannot see. Exposing it as an
 * external store keeps rendering hydration-safe: the server snapshot is null,
 * so nothing renders until the browser has read the real value.
 */
const listeners = new Set<() => void>();

function subscribeDismissed(onChange: () => void) {
  listeners.add(onChange);

  return () => void listeners.delete(onChange);
}

function dismissedSnapshot(): string {
  return window.localStorage.getItem(DISMISSED_KEY) ?? "[]";
}

function rememberDismissal(id: string) {
  window.localStorage.setItem(
    DISMISSED_KEY,
    JSON.stringify([...parseIds(dismissedSnapshot()), id]),
  );

  for (const onChange of listeners) onChange();
}

function parseIds(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

interface BannerPopupProps {
  /** Server-rendered so the first banner shows without waiting on the stream. */
  initialBanners: Banner[];
}

export function BannerPopup({ initialBanners }: BannerPopupProps) {
  const [banners, setBanners] = useState(initialBanners);
  const raw = useSyncExternalStore(
    subscribeDismissed,
    dismissedSnapshot,
    () => null,
  );
  const dismissed = useMemo(() => (raw === null ? null : parseIds(raw)), [raw]);

  useEffect(() => {
    const source = new EventSource("/api/banners/stream");

    source.addEventListener("banners", (event) => {
      try {
        setBanners(
          JSON.parse((event as MessageEvent<string>).data) as Banner[],
        );
      } catch {
        // A malformed frame should not take the page down.
      }
    });

    return () => source.close();
  }, []);

  if (dismissed === null) return null;

  const banner = banners.find((item) => !dismissed.includes(item.id));

  if (!banner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="banner-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl">
        {banner.imageUrl && (
          // Admin-supplied host, so a plain <img> rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt=""
            className="h-40 w-full object-cover"
          />
        )}
        <div className="space-y-4 p-6">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${variantStyles[banner.variant]}`}
          >
            {variantLabels[banner.variant]}
          </span>
          <h2 id="banner-title" className="text-xl font-bold text-white">
            {banner.title}
          </h2>
          {banner.body && (
            <p className="leading-7 text-zinc-300">{banner.body}</p>
          )}
          <div className="flex flex-wrap gap-3 pt-1">
            {banner.linkUrl && (
              <a
                href={banner.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                {banner.linkLabel ?? "Learn more"}
              </a>
            )}
            <button
              type="button"
              onClick={() => rememberDismissal(banner.id)}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
