import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUsers } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/session";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/users");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const users = await getAdminUsers().catch(() => null);

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Admin
        </Link>

        <header className="mt-6 border-b border-border pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
            Account management
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Users
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                View MangaKai accounts and control access to creator,
                moderation, and administrative tools.
              </p>
            </div>

            {users && (
              <div className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Accounts
                </p>

                <p className="mt-0.5 text-xl font-bold text-foreground">
                  {users.length}
                </p>
              </div>
            )}
          </div>
        </header>

        <section className="mt-8">
          {!users ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
              <h2 className="font-semibold text-foreground">
                Users could not be loaded
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Check the API deployment and try again.
              </p>
            </div>
          ) : (
            <UsersTable initialUsers={users} currentUserId={currentUser.id} />
          )}
        </section>
      </div>
    </main>
  );
}
