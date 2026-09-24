export default function OfflinePage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-violet-400">
          MANGAKAI
        </p>

        <h1 className="text-3xl font-bold">You&apos;re offline</h1>

        <p className="mt-4 text-zinc-400">
          MangaKai can&apos;t reach the network right now. Reconnect and try
          again.
        </p>
      </div>
    </main>
  );
}
