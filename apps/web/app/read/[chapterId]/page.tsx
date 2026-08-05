import { Reader } from "@/components/reader";

/**
 * The reader is a client component: it measures every page fetch so the API
 * can report retrieval health back to MangaDex@Home, which is only possible in
 * the code that performs the fetch.
 *
 * `manga` and `title` arrive as search params from the chapter list so the
 * page can render its heading and back link without a second round trip.
 */
export default async function ReadPage(props: PageProps<"/read/[chapterId]">) {
  const { chapterId } = await props.params;
  const { manga, title } = await props.searchParams;

  const mangaId = typeof manga === "string" ? manga : null;
  const heading = typeof title === "string" ? title : "Reading";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#251447_0%,#0a0910_38%)] px-4 py-8 sm:px-6 lg:px-8">
      <Reader chapterId={chapterId} mangaId={mangaId} heading={heading} />
    </main>
  );
}
