"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@mangakai/shared";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "./actions";

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();

  const [username, setUsername] = useState(user.username ?? "");
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");

  const normalizedUsername = username.trim().toLowerCase();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateProfileAction({
        username: normalizedUsername,
        displayName,
        bio,
        avatarUrl,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Unable to update your profile.");
        return;
      }

      toast.success("Profile updated.");

      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="font-bold text-white">Profile picture</h2>

          <p className="mt-1 text-sm text-zinc-400">
            For now, MangaKai uses an image URL. Direct image uploads can
            replace this once creator storage is added.
          </p>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar className="size-24 shrink-0 ring-1 ring-white/10">
            {avatarUrl.trim() ? (
              <AvatarImage
                src={avatarUrl.trim()}
                alt={displayName || "Profile avatar"}
              />
            ) : null}

            <AvatarFallback className="bg-brand-soft text-xl font-bold text-brand-hover">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="w-full space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>

            <Input
              id="avatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.png"
              maxLength={2_000}
            />

            <p className="text-xs leading-5 text-subtle">
              Leave this blank to use your initials.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="font-bold text-white">Public profile</h2>

          <p className="mt-1 text-sm text-zinc-400">
            This information will appear on your public MangaKai profile.
          </p>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>

            <div className="flex items-center rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <span className="pl-3 text-sm text-muted-foreground">@</span>

              <input
                id="username"
                value={username}
                onChange={(event) => {
                  setUsername(
                    event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  );
                }}
                minLength={3}
                maxLength={24}
                required
                autoComplete="username"
                className="h-9 min-w-0 flex-1 bg-transparent px-1.5 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                placeholder="your_username"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs leading-5 text-subtle">
                3–24 characters. Letters, numbers, and underscores only.
              </p>

              {normalizedUsername.length >= 3 && (
                <p className="text-xs text-zinc-500">
                  mangakai-zeta.vercel.app/u/{normalizedUsername}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>

            <Input
              id="displayName"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={50}
              required
            />

            <p className="text-xs leading-5 text-subtle">
              This does not need to be unique.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="bio">Bio</Label>

              <span className="text-xs text-subtle">{bio.length}/300</span>
            </div>

            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={300}
              rows={5}
              placeholder="Tell people a little about yourself."
              className="resize-none"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <div>
          {user.username ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/u/${encodeURIComponent(user.username!)}`)
              }
            >
              <ExternalLinkIcon />
              View profile
            </Button>
          ) : (
            <p className="max-w-md text-xs leading-5 text-subtle">
              Choose a username and save your profile before your public profile
              becomes available.
            </p>
          )}
        </div>

        <Button type="submit" disabled={pending}>
          <CheckIcon />

          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
