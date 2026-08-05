"use client";

import { useEffect, useState } from "react";
import type { Banner } from "@mangakai/shared";
import { DISMISSED_COOKIE, serializeDismissed } from "@/lib/dismissed-banners";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const variantStyles: Record<Banner["variant"], string> = {
  info: "border-sky-400/25 bg-sky-500/15 text-sky-100",
  announcement: "border-violet-400/25 bg-violet-500/15 text-violet-100",
  warning: "border-amber-400/25 bg-amber-500/15 text-amber-100",
};

const pillStyles: Record<Banner["variant"], string> = {
  info: "bg-sky-400/20 text-sky-200",
  announcement: "bg-violet-400/20 text-violet-200",
  warning: "bg-amber-400/20 text-amber-200",
};

const variantLabels: Record<Banner["variant"], string> = {
  info: "Notice",
  announcement: "Announcement",
  warning: "Heads up",
};

function persistDismissed(ids: string[]): void {
  document.cookie = `${DISMISSED_COOKIE}=${serializeDismissed(ids)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function BannerRow({
  banner,
  onDismiss,
}: {
  banner: Banner;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`border-b backdrop-blur-sm ${variantStyles[banner.variant]}`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        {banner.imageUrl && (
          // Admin-supplied host, so a plain <img> rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.imageUrl}
            alt=""
            className="hidden size-8 shrink-0 rounded-md object-cover sm:block"
          />
        )}

        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider sm:inline ${pillStyles[banner.variant]}`}
        >
          {variantLabels[banner.variant]}
        </span>

        <p className="min-w-0 flex-1 text-sm leading-6">
          <span className="font-semibold">{banner.title}</span>
          {banner.body && (
            <span className="ml-2 opacity-80">{banner.body}</span>
          )}
        </p>

        {banner.linkUrl && (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 whitespace-nowrap rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
          >
            {banner.linkLabel ?? "Learn more"}
          </a>
        )}

        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss: ${banner.title}`}
          className="shrink-0 rounded-md p-1.5 text-lg leading-none opacity-60 transition hover:bg-white/10 hover:opacity-100"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

interface BannerBarProps {
  /** Already filtered by the server, so this renders as-is during SSR. */
  initialBanners: Banner[];
  /** Needed on the client to filter banners that arrive later over SSE. */
  dismissedIds: string[];
}

/** Site-wide notice strip pinned to the top of every page. */
export function BannerBar({ initialBanners, dismissedIds }: BannerBarProps) {
  const [banners, setBanners] = useState(initialBanners);
  const [dismissed, setDismissed] = useState(dismissedIds);

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

  const dismiss = (id: string) => {
    const next = [...dismissed, id];

    setDismissed(next);
    persistDismissed(next);
  };

  const visible = banners.filter((banner) => !dismissed.includes(banner.id));

  if (visible.length === 0) return null;

  return (
    <div className="sticky top-0 z-50">
      {visible.map((banner) => (
        <BannerRow
          key={banner.id}
          banner={banner}
          onDismiss={() => dismiss(banner.id)}
        />
      ))}
    </div>
  );
}
