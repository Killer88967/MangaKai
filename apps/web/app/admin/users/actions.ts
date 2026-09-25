"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@mangakai/shared";
import { updateAdminUserRole } from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/session";

interface UpdateRoleResult {
  ok: boolean;
  error?: string;
}

export async function updateUserRoleAction(
  userId: string,
  role: UserRole,
): Promise<UpdateRoleResult> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "admin") {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await updateAdminUserRole(userId, role);

    revalidatePath("/admin");
    revalidatePath("/admin/users");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update this user's role.",
    };
  }
}
