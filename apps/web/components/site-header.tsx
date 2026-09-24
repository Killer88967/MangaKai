import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/session";

/**
 * Rendered on the server, so the signed-in state is in the initial HTML — no
 * flash of "Sign in" for someone who is already signed in.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-black tracking-[-0.04em] text-white"
        >
          Manga<span className="text-brand">Kai</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Home
          </Link>

          <Link
            href="/downloads"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
          >
            Downloads
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/downloads"
            aria-label="Downloads"
            className="flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm text-zinc-300 transition hover:border-border-strong hover:bg-white/5 hover:text-white md:hidden"
          >
            <span aria-hidden="true">↓</span>
          </Link>

          {user ? (
            <>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-40 truncate text-sm font-medium text-zinc-200">
                  {user.displayName}
                </p>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="h-10 rounded-xl px-3 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 items-center rounded-xl px-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white sm:flex"
              >
                Sign in
              </Link>

              <Link
                href="/register"
                className="flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                <span className="hidden sm:inline">Create account</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
