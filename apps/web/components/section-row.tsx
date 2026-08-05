import type { ReactNode } from "react";

interface SectionRowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/** A titled, horizontally scrolling shelf. Shared by every homepage row. */
export function SectionRow({ title, subtitle, children }: SectionRowProps) {
  return (
    <section className="mt-12">
      <div className="mb-4">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-4">{children}</div>
    </section>
  );
}

/** Fixed-width slot so cards keep their aspect ratio inside a scroller. */
export function RowItem({ children }: { children: ReactNode }) {
  return <div className="w-36 shrink-0 snap-start sm:w-44">{children}</div>;
}
