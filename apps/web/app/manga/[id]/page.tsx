type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MangaPage({ params }: Props) {
  const { id } = await params;

  const res = await fetch(`http://localhost:8787/api/manga/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <main>Failed to load manga.</main>;
  }

  const manga = await res.json();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <pre>{JSON.stringify(manga, null, 2)}</pre>
    </main>
  );
}
