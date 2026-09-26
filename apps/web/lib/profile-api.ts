import { cookies } from "next/headers";
import type { ApiError, User } from "@mangakai/shared";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

export interface UpdateProfileInput {
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;

  if (!token) {
    throw new Error("You need to be signed in.");
  }

  const response = await fetch(`${API_URL}/api/users/me/profile`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<ApiError>;

    throw new Error(body.error ?? "Unable to update your profile.");
  }

  return response.json() as Promise<User>;
}
