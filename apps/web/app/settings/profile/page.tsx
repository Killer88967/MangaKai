import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile settings — MangaKai",
};

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/settings/profile");
  }

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[800px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-8 border-b border-border pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-hover">
            Settings
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            Profile
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Choose how your MangaKai profile appears to readers and creators.
          </p>
        </header>

        <ProfileForm user={user} />
      </div>
    </main>
  );
}
