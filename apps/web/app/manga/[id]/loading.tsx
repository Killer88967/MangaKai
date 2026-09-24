export default function Loading() {
  return (
    <main className="flex-1 animate-pulse">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-[1280px] px-4 pb-8 pt-6 sm:px-6 sm:pb-10 lg:px-8">
          <div className="mb-7 h-5 w-20 rounded bg-white/8" />

          <div className="grid gap-6 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-end lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10">
            <div className="mx-auto aspect-2/3 w-40 rounded-2xl bg-white/8 sm:mx-0 sm:w-full" />

            <div className="min-w-0">
              <div className="h-3 w-16 rounded bg-white/8" />

              <div className="mt-3 h-10 w-4/5 rounded bg-white/10 sm:h-12" />

              <div className="mt-3 h-4 w-2/3 rounded bg-white/5" />

              <div className="mt-5 flex flex-wrap gap-2">
                <div className="h-7 w-24 rounded-full bg-white/5" />
                <div className="h-7 w-20 rounded-full bg-white/5" />
                <div className="h-7 w-28 rounded-full bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-10">
        <div className="space-y-10">
          <section>
            <div className="h-6 w-24 rounded bg-white/10" />

            <div className="mt-4 space-y-3">
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
            </div>
          </section>

          <section>
            <div className="h-6 w-28 rounded bg-white/10" />

            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="flex h-[72px] items-center gap-4 border-b border-border px-4 last:border-b-0"
                >
                  <div className="h-4 w-28 rounded bg-white/8" />

                  <div className="h-3 w-36 rounded bg-white/5" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-7">
          <div>
            <div className="h-3 w-24 rounded bg-white/8" />

            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="h-7 w-20 rounded-lg bg-white/5" />
              ))}
            </div>
          </div>

          <div className="space-y-6 border-t border-border pt-6">
            <div>
              <div className="h-3 w-16 rounded bg-white/8" />
              <div className="mt-3 h-4 w-36 rounded bg-white/5" />
            </div>

            <div>
              <div className="h-3 w-14 rounded bg-white/8" />
              <div className="mt-3 h-4 w-32 rounded bg-white/5" />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
