import type { ReactNode } from "react";

/**
 * Centres the sign-in and register screens. A route group, so `(auth)` never
 * appears in the URL — the pages are `/login` and `/register`.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      {children}
    </main>
  );
}
