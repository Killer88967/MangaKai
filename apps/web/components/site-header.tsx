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
    <header className="border-b border-white/10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-400"
        >
          MangaKai
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{user.displayName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-400"
            >
              Create account
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
