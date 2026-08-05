export default function Loading() {
  return (
    <main className="min-h-screen animate-pulse bg-[radial-gradient(circle_at_top,#251447_0%,#0a0910_38%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 h-5 w-28 rounded bg-white/10" />
        <div className="grid gap-8 rounded-3xl border border-white/10 bg-white/5.5 p-5 sm:p-7 md:grid-cols-[240px_1fr]">
          <div className="mx-auto aspect-2/3 w-full max-w-60 rounded-2xl bg-white/10 md:mx-0" />
          <div className="space-y-5 py-2">
            <div className="h-10 w-4/5 rounded bg-white/10" />
            <div className="h-4 w-2/3 rounded bg-white/5" />
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-20 rounded-xl bg-white/5" />
              ))}
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-5 w-32 rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
