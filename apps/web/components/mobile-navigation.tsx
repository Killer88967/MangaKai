"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
  icon: React.ReactNode;
}

const items: NavigationItem[] = [
  {
    label: "Home",
    href: "/",
    match: (pathname) => pathname === "/" || pathname.startsWith("/manga/"),
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="size-5"
      >
        <path
          d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5Z"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Search",
    href: "/#search",
    match: () => false,
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="size-5"
      >
        <circle cx="11" cy="11" r="7" strokeWidth="1.8" />

        <path d="m16 16 4 4" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Downloads",
    href: "/downloads",
    match: (pathname) => pathname.startsWith("/downloads"),
    icon: (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="size-5"
      >
        <path
          d="M12 3v12m0 0 4-4m-4 4-4-4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path d="M5 20h14" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

/**
 * Compact navigation for phone-sized layouts and installed PWAs.
 *
 * The reader intentionally has no bottom navigation: while reading, the manga
 * should own the screen and its own reader controls are enough to get back out.
 *
 * Authentication pages are also excluded so account creation and sign-in stay
 * focused and do not look like ordinary application screens.
 */
export function MobileNavigation() {
  const pathname = usePathname();

  const hidden =
    pathname.startsWith("/read/") ||
    pathname === "/login" ||
    pathname === "/register";

  if (hidden) return null;

  return (
    <>
      {/*
        Keeps normal page content above the fixed navigation, including the
        iPhone Home Indicator safe area.
      */}
      <div
        aria-hidden="true"
        className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden"
      />

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid h-[4.25rem] max-w-md grid-cols-3 px-3">
          {items.map((item) => {
            const active = item.match(pathname);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition",
                  active
                    ? "text-brand-hover"
                    : "text-zinc-500 hover:text-zinc-200",
                ].join(" ")}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-brand"
                  />
                )}

                {item.icon}

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
