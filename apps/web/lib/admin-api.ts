import { cookies } from "next/headers";
import type {
  AdminBanner,
  AdminStaffPick,
  AdminUser,
  ApiError,
  UserRole,
} from "@mangakai/shared";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

export interface AdminBannerInput {
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  variant?: "info" | "announcement" | "warning";
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface AdminStaffPickInput {
  mangaId: string;
  note?: string | null;
  position?: number;
  active?: boolean;
}

/**
 * Server-only request helper for MangaKai's administrative API.
 *
 * Admin endpoints are mounted directly under `/admin` on the API rather than
 * the browser-facing `/api/` namespace, so server components call them directly
 * and forward the user's existing session as a bearer token.
 */
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    throw new Error("You need to be signed in.");
  }

  const response = await fetch(`${API_URL}/admin${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<ApiError>;

    throw new Error(body.error ?? "Admin request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getAdminBanners(): Promise<AdminBanner[]> {
  return adminFetch("/banners");
}

export function getAdminStaffPicks(): Promise<AdminStaffPick[]> {
  return adminFetch("/staff-picks");
}

export function getAdminUsers(): Promise<AdminUser[]> {
  return adminFetch("/users");
}

export function updateAdminUserRole(
  userId: string,
  role: UserRole,
): Promise<AdminUser> {
  return adminFetch(`/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ role }),
  });
}

export function createAdminBanner(
  input: AdminBannerInput,
): Promise<AdminBanner> {
  return adminFetch("/banners", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function updateAdminBanner(
  id: string,
  input: Partial<AdminBannerInput>,
): Promise<AdminBanner> {
  return adminFetch(`/banners/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function deleteAdminBanner(id: string): Promise<void> {
  return adminFetch(`/banners/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function createAdminStaffPick(
  input: AdminStaffPickInput,
): Promise<void> {
  return adminFetch("/staff-picks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function updateAdminStaffPick(
  mangaId: string,
  input: {
    note?: string | null;
    position?: number;
    active?: boolean;
  },
): Promise<AdminStaffPick> {
  return adminFetch(`/staff-picks/${encodeURIComponent(mangaId)}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function moveAdminStaffPick(
  mangaId: string,
  position: number,
): Promise<AdminStaffPick[]> {
  return adminFetch(`/staff-picks/${encodeURIComponent(mangaId)}/move`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ position }),
  });
}

export function switchAdminStaffPick(
  from: string,
  to: string,
  note?: string | null,
): Promise<AdminStaffPick> {
  return adminFetch("/staff-picks/switch", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      note,
    }),
  });
}

export function deleteAdminStaffPick(mangaId: string): Promise<void> {
  return adminFetch(`/staff-picks/${encodeURIComponent(mangaId)}`, {
    method: "DELETE",
  });
}
