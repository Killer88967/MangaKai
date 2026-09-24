import type { ReactNode } from "react";

interface SectionRowProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * A horizontally scrolling discovery shelf.
 *
 * The edge-to-edge mobile overflow is intentional: it feels closer to a native
 * media app while desktop keeps the row aligned with the rest of the page.
 */
export function SectionRow({ title, subtitle, children }: SectionRowProps) {
  return (
    <section className="mt-10 sm:mt-14">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.025em] text-white sm:text-2xl">
            {title}
          </h2>

          {subtitle && <p className="mt-1 text-sm text-subtle">{subtitle}</p>}
        </div>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-0 sm:gap-4 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}

/** Fixed-width slot so covers remain consistent inside discovery shelves. */
export function RowItem({ children }: { children: ReactNode }) {
  return (
    <div className="w-[138px] shrink-0 snap-start sm:w-[160px] lg:w-[176px]">
      {children}
    </div>
  );
}
