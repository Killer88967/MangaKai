"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiError, AuthResponse } from "@mangakai/shared";
import { emptyAuthState, type AuthFormState } from "@/lib/auth-state";
import { SESSION_COOKIE } from "@/lib/session";

const API_URL = process.env.API_URL ?? "http://localhost:8787";

/**
 * Where to send someone after they sign in.
 *
 * Only same-site paths are honoured. Without this check, `?next=https://evil…`
 * turns the login page into an open redirect that borrows MangaKai's
 * credibility for a phishing link. `//evil.com` is a protocol-relative URL, so
 * checking for a leading `/` alone is not enough.
 */
function safeRedirect(target: FormDataEntryValue | null): string {
  const path = typeof target === "string" ? target : "";

  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

async function authenticate(
  path: "login" | "register",
  body: Record<string, string>,
): Promise<AuthFormState> {
  let auth: AuthResponse;

  try {
    const response = await fetch(`${API_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const failure = (await response.json().catch(() => ({}))) as
        Partial<ApiError> | undefined;

      return { error: failure?.error ?? "Something went wrong. Try again." };
    }

    auth = await response.json();
  } catch {
    return { error: "Could not reach MangaKai. Check your connection." };
  }

  // The API also sets this cookie when a client calls it directly. Here the
  // request came from the server, so the browser never saw that response — we
  // set the same cookie ourselves from the token in the body.
  (await cookies()).set(SESSION_COOKIE, auth.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(auth.expiresAt),
  });

  return emptyAuthState;
}

export async function loginAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await authenticate("login", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (result.error) return result;

  // redirect throws, so nothing after it runs — and it must sit outside the
  // try/catch above, which would otherwise swallow that control-flow throw.
  redirect(safeRedirect(formData.get("next")));
}

export async function registerAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = await authenticate("register", {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  });

  if (result.error) return result;

  redirect(safeRedirect(formData.get("next")));
}

/**
 * Revokes the session server-side as well as clearing the cookie — deleting
 * only the cookie would leave a working token in the database.
 */
export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // Clear the cookie regardless: the user asked to be signed out, and a
      // session they can no longer present is the important half.
    }
  }

  store.delete(SESSION_COOKIE);

  redirect("/");
}
