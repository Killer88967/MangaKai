"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react";
import type { User } from "@mangakai/shared";
import { logoutAction } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export function AvatarDropdownMenu({ user }: AvatarDropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profileHref = user.username
    ? `/u/${encodeURIComponent(user.username)}`
    : "/settings/profile";

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand/40"
      >
        <Avatar className="size-9 cursor-pointer ring-1 ring-white/10 transition hover:ring-brand/60">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          ) : null}

          <AvatarFallback className="bg-brand-soft font-bold text-brand-hover">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl"
        >
          <div className="px-2 py-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {user.displayName}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {user.username ? `@${user.username}` : user.email}
            </p>
          </div>

          <div className="my-1 h-px bg-border" />

          <MenuLink
            href={profileHref}
            icon={<UserIcon />}
            onClick={() => setOpen(false)}
          >
            Profile
          </MenuLink>

          <MenuLink
            href="/settings/profile"
            icon={<SettingsIcon />}
            onClick={() => setOpen(false)}
          >
            Account settings
          </MenuLink>

          {(user.role === "creator" || user.role === "admin") && (
            <MenuLink
              href="/creator"
              icon={<UploadIcon />}
              onClick={() => setOpen(false)}
            >
              Creator Studio
            </MenuLink>
          )}

          {user.role === "admin" && (
            <>
              <div className="my-1 h-px bg-border" />

              <MenuLink
                href="/admin"
                icon={<ShieldCheckIcon className="text-brand-hover" />}
                onClick={() => setOpen(false)}
                className="text-brand-hover"
              >
                Admin Panel
              </MenuLink>
            </>
          )}

          <div className="my-1 h-px bg-border" />

          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
            >
              <LogOutIcon className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  className = "",
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-white ${className}`}
    >
      <span className="[&>svg]:size-4">{icon}</span>
      {children}
    </Link>
  );
}
