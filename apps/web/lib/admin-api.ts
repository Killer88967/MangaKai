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

/**
 * Server-only request helper for MangaKai's administrative API.
 *
 * Admin endpoints are mounted directly under `/admin` on the API rather than
 * the browser-facing `/api/ namespace, so server components call them directly
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
