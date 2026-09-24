import { Reader } from "@/components/reader";

/**
 * The reader is a client component because chapter pages and downloaded copies
 * are managed in the browser.
 *
 * Manga and chapter metadata arrive as search params from the chapter list so
 * the reader can render immediately and preserve enough information for the
 * offline Downloads library without another manga lookup.
 */
export default async function ReadPage(props: PageProps<"/read/[chapterId]">) {
  const { chapterId } = await props.params;
  const { manga, title, series, cover } = await props.searchParams;

  const mangaId = typeof manga === "string" ? manga : null;
  const heading = typeof title === "string" ? title : "Reading";
  const mangaTitle = typeof series === "string" ? series : undefined;
  const mangaCover = typeof cover === "string" ? cover : null;

  return (
    <main className="min-h-screen bg-background">
      <Reader
        chapterId={chapterId}
        mangaId={mangaId}
        mangaTitle={mangaTitle}
        mangaCover={mangaCover}
        heading={heading}
      />
    </main>
  );
}
