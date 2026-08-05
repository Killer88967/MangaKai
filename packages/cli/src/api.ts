import type {
  AdminBanner,
  AdminStaffPick,
  ApiError,
  MangaSummary,
  Paginated,
} from "@mangakai/shared";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

/** Thrown for anything the user can fix: bad token, validation, server down. */
export class CliError extends Error {}

function adminToken(): string {
  const token = process.env.ADMIN_TOKEN;

  if (!token) {
    throw new CliError(
      "ADMIN_TOKEN is not set. Copy apps/api/.env.example to apps/api/.env.",
    );
  }

  return token;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T | null> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${adminToken()}`,
        "content-type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new CliError(
      `Could not reach the API at ${API_URL}. Is it running? Try: pnpm dev`,
    );
  }

  if (response.status === 204) return null;

  const body: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (body as ApiError).error ?? response.statusText;

    if (response.status === 401) {
      throw new CliError(
        `Unauthorized — ADMIN_TOKEN does not match the server.`,
      );
    }

    throw new CliError(message);
  }

  return body as T;
}

/** Matches the admin banner input accepted by `POST /admin/banners`. */
export interface BannerPayload {
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  variant?: AdminBanner["variant"];
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export function listBanners() {
  return request<AdminBanner[]>("/admin/banners") as Promise<AdminBanner[]>;
}

export function createBanner(payload: BannerPayload) {
  return request<AdminBanner>("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<AdminBanner>;
}

export function updateBanner(id: string, payload: Partial<BannerPayload>) {
  return request<AdminBanner>(`/admin/banners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<AdminBanner>;
}

export function deleteBanner(id: string) {
  return request<null>(`/admin/banners/${id}`, { method: "DELETE" });
}

/** Matches the admin input accepted by `POST /admin/staff-picks`. */
export interface StaffPickPayload {
  mangaId: string;
  note?: string | null;
  position?: number;
  active?: boolean;
}

export function listStaffPicks() {
  return request<AdminStaffPick[]>("/admin/staff-picks") as Promise<
    AdminStaffPick[]
  >;
}

export function addStaffPick(payload: StaffPickPayload) {
  return request<AdminStaffPick>("/admin/staff-picks", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<AdminStaffPick>;
}

export function updateStaffPick(
  mangaId: string,
  patch: Partial<Omit<StaffPickPayload, "mangaId">>,
) {
  return request<AdminStaffPick>(`/admin/staff-picks/${mangaId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }) as Promise<AdminStaffPick>;
}

export function deleteStaffPick(mangaId: string) {
  return request<null>(`/admin/staff-picks/${mangaId}`, { method: "DELETE" });
}

/** Returns the whole list, renumbered, so callers can show the new order. */
export function moveStaffPick(mangaId: string, position: number) {
  return request<AdminStaffPick[]>(`/admin/staff-picks/${mangaId}/move`, {
    method: "POST",
    body: JSON.stringify({ position }),
  }) as Promise<AdminStaffPick[]>;
}

export function switchStaffPick(
  from: string,
  to: string,
  note?: string | null,
) {
  return request<AdminStaffPick>("/admin/staff-picks/switch", {
    method: "POST",
    body: JSON.stringify({ from, to, note }),
  }) as Promise<AdminStaffPick>;
}

/**
 * Public search, used so `picks add` can take a title instead of making
 * someone hunt down a MangaDex UUID by hand.
 */
export function searchManga(query: string) {
  return request<Paginated<MangaSummary>>(
    `/api/manga/search?q=${encodeURIComponent(query)}&limit=10`,
  ) as Promise<Paginated<MangaSummary>>;
}

export { API_URL };
