"use server";

import { revalidatePath } from "next/cache";
import { updateProfile } from "@/lib/profile-api";
import { getCurrentUser } from "@/lib/session";

export interface UpdateProfileResult {
  ok: boolean;
  error?: string;
  username?: string;
}

export async function updateProfileAction(input: {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}): Promise<UpdateProfileResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return {
      ok: false,
      error: "You need to be signed in.",
    };
  }

  try {
    const user = await updateProfile({
      username: input.username,
      displayName: input.displayName,
      bio: input.bio.trim() || null,
      avatarUrl: input.avatarUrl.trim() || null,
    });

    revalidatePath("/");
    revalidatePath("/settings/profile");

    if (user.username) {
      revalidatePath(`/u/${user.username}`);
    }

    return {
      ok: true,
      username: user.username ?? undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update your profile.",
    };
  }
}
