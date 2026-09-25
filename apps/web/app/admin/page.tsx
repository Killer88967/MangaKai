import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getAdminBanners,
  getAdminStaffPicks,
  getAdminUsers,
} from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  const [banners, staffPicks, users] = await Promise.all([
    getAdminBanners().catch(() => null),
    getAdminStaffPicks().catch(() => null),
    getAdminUsers().catch(() => null),
  ]);

  const activeBanners =
    banners?.filter((banner) => banner.active).length ?? null;

  const activePicks = staffPicks?.filter((pick) => pick.active).length ?? null;

  const draftPicks = staffPicks?.filter((pick) => !pick.active).length ?? null;

  const adminCount =
    users?.filter((account) => account.role === "admin").length ?? null;

  const creatorCount =
    users?.filter((account) => account.role === "creator").length ?? null;

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="border-b border-border pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
            MangaKai staff
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                Admin
              </h1>

              <p className="mt-2 text-sm text-zinc-400">
                Signed in as {user.displayName}
              </p>
            </div>

            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-hover">
              {user.role}
            </span>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="text-lg font-bold text-white">Overview</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStat
              label="Banners"
              value={banners ? banners.length : "—"}
              detail={
                activeBanners === null
                  ? "Unavailable"
                  : `${activeBanners} active`
              }
            />

            <DashboardStat
              label="Staff picks"
              value={staffPicks ? staffPicks.length : "—"}
              detail={
                activePicks === null || draftPicks === null
                  ? "Unavailable"
                  : `${activePicks} active · ${draftPicks} draft`
              }
            />

            <DashboardStat
              label="Users"
              value={users ? users.length : "—"}
              detail={
                users
                  ? `${adminCount ?? 0} admin${adminCount === 1 ? "" : "s"} · ${
                      creatorCount ?? 0
                    } creator${creatorCount === 1 ? "" : "s"}`
                  : "Unavailable"
              }
            />

            <DashboardStat label="Reports" value="—" detail="Not configured" />
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Management</h2>

            <p className="mt-1 text-sm text-subtle">
              MangaKai administration tools
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AdminDestination
              href="/admin/banners"
              title="Banners"
              description="Create announcements, warnings, and scheduled notices."
              status={
                banners ? `${banners.length} configured` : "API unavailable"
              }
            />

            <AdminDestination
              href="/admin/staff-picks"
              title="Staff picks"
              description="Manage the manga featured by the MangaKai team."
              status={
                staffPicks
                  ? `${staffPicks.length} configured`
                  : "API unavailable"
              }
            />

            <AdminDestination
              href="/admin/users"
              title="Users"
              description="View accounts and manage MangaKai roles."
              status={users ? `${users.length} accounts` : "API Unavailable"}
            />

            <AdminDestination
              title="Series"
              description="Review and manage MangaKai-hosted creator series."
              status="Planned"
              disabled
            />

            <AdminDestination
              title="Reports"
              description="Review user, chapter, and series reports."
              status="Planned"
              disabled
            />

            <AdminDestination
              title="Audit log"
              description="Track important administrative actions."
              status="Planned"
              disabled
            />
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-white">Recent banners</h2>

              <Link
                href="/admin/banners"
                className="text-xs font-semibold text-brand-hover hover:text-white"
              >
                Manage →
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {!banners ? (
                <AdminUnavailable />
              ) : banners.length === 0 ? (
                <AdminEmpty text="No banners have been created." />
              ) : (
                banners.slice(0, 5).map((banner) => (
                  <div
                    key={banner.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <span
                      className={[
                        "size-2 shrink-0 rounded-full",
                        banner.active ? "bg-emerald-400" : "bg-zinc-600",
                      ].join(" ")}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {banner.title}
                      </p>

                      <p className="mt-0.5 text-xs capitalize text-subtle">
                        {banner.variant}
                      </p>
                    </div>

                    <span className="text-xs text-zinc-500">
                      {banner.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-white">Staff picks</h2>

              <Link
                href="/admin/staff-picks"
                className="text-xs font-semibold text-brand-hover hover:text-white"
              >
                Manage →
              </Link>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {!staffPicks ? (
                <AdminUnavailable />
              ) : staffPicks.length === 0 ? (
                <AdminEmpty text="No staff picks have been configured." />
              ) : (
                staffPicks.slice(0, 5).map((pick) => (
                  <div
                    key={pick.id}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xs font-bold text-brand-hover">
                      {pick.position + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {pick.title ?? "Unavailable MangaDex title"}
                      </p>

                      {pick.note && (
                        <p className="mt-0.5 truncate text-xs text-subtle">
                          {pick.note}
                        </p>
                      )}
                    </div>

                    <span
                      className={
                        pick.active
                          ? "text-xs text-emerald-400"
                          : "text-xs text-zinc-600"
                      }
                    >
                      {pick.active ? "Active" : "Draft"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-subtle">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}

function AdminDestination({
  href,
  title,
  description,
  status,
  disabled = false,
}: {
  href?: string;
  title: string;
  description: string;
  status: string;
  disabled?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-bold text-zinc-100">{title}</h3>

        <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-500">
          {status}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>

      {!disabled && (
        <span className="mt-5 block text-sm font-semibold text-brand-hover">
          Open →
        </span>
      )}
    </>
  );

  if (disabled || !href) {
    return (
      <div className="rounded-2xl border border-border bg-surface/50 p-5 opacity-60">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-surface p-5 transition hover:border-border-strong hover:bg-surface-hover"
    >
      {content}
    </Link>
  );
}

function AdminEmpty({ text }: { text: string }) {
  return <p className="p-5 text-sm text-zinc-500">{text}</p>;
}

function AdminUnavailable() {
  return (
    <p className="p-5 text-sm text-red-300">
      This section could not be loaded.
    </p>
  );
}
