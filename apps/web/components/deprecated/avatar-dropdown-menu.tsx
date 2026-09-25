"use client";

import Link from "next/link";
import {
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
  UploadIcon,
} from "lucide-react";
import type { User } from "@mangakai/shared";
import { logoutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AvatarDropdownMenuProps {
  user: User & {
    username?: string | null;
    avatarUrl?: string | null;
  };
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

/** @deprecated */
export function AvatarDropdownMenu({ user }: AvatarDropdownMenuProps) {
  const profileHref = user.username
    ? `/u/${encodeURIComponent(user.username)}`
    : "/settings/profile";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Open account menu"
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand/40"
          />
        }
      >
        <Avatar className="size-9 cursor-pointer ring-1 ring-white/10 transition hover:ring-brand/60">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          ) : null}

          <AvatarFallback className="bg-brand-soft font-bold text-brand-hover">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.displayName}
            </p>

            <p className="truncate text-xs font-normal text-muted-foreground">
              {user.username ? `@${user.username}` : user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          render={<Link href={profileHref} className="w-full" />}
        >
          <UserIcon />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem
          render={<Link href="/settings/profile" className="w-full" />}
        >
          <SettingsIcon />
          Account settings
        </DropdownMenuItem>

        {(user.role === "creator" || user.role === "admin") && (
          <DropdownMenuItem
            render={<Link href="/creator" className="w-full" />}
          >
            <UploadIcon />
            Creator Studio
          </DropdownMenuItem>
        )}

        {user.role === "admin" && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={<Link href="/admin" className="w-full" />}
            >
              <ShieldCheckIcon className="text-brand-hover" />
              <span className="text-brand-hover">Admin Panel</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          render={
            <form action={logoutAction} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center gap-1.5 text-left"
              >
                <LogOutIcon />
                Sign out
              </button>
            </form>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
