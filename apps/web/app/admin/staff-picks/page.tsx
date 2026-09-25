import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminStaffPicks } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/session";
import { StaffPicksManager } from "./staff-picks-manager";

export default async function AdminStaffPicksPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/admin/staff-picks");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const staffPicks = await getAdminStaffPicks().catch(() => null);

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Admin
        </Link>

        <header className="mt-6 border-b border-border pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
            Editorial
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            Staff Picks
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Choose which MangaDex titles MangaKai highlights on the homepage and
            control their order.
          </p>
        </header>

        <section className="mt-8">
          {!staffPicks ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
              <h2 className="font-semibold text-foreground">
                Staff picks could not be loaded
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Check the API deployment and try again.
              </p>
            </div>
          ) : (
            <StaffPicksManager initialPicks={staffPicks} />
          )}
        </section>
      </div>
    </main>
  );
}
