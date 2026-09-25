"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminStaffPick,
  deleteAdminStaffPick,
  moveAdminStaffPick,
  switchAdminStaffPick,
  updateAdminStaffPick,
} from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/session";

interface StaffPickActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  return user?.role === "admin";
}

function nullable(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function refreshStaffPicks(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/staff-picks");
}

export async function createStaffPickAction(input: {
  mangaId: string;
  note: string;
  active: boolean;
}): Promise<StaffPickActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await createAdminStaffPick({
      mangaId: input.mangaId.trim(),
      note: nullable(input.note),
      active: input.active,
    });

    refreshStaffPicks();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to create staff pick.",
    };
  }
}

export async function updateStaffPickAction(
  mangaId: string,
  input: {
    note: string;
    active: boolean;
  },
): Promise<StaffPickActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await updateAdminStaffPick(mangaId, {
      note: nullable(input.note),
      active: input.active,
    });

    refreshStaffPicks();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to update staff pick.",
    };
  }
}

export async function moveStaffPickAction(
  mangaId: string,
  position: number,
): Promise<StaffPickActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await moveAdminStaffPick(mangaId, position);

    refreshStaffPicks();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to move staff pick.",
    };
  }
}

export async function switchStaffPickAction(
  from: string,
  to: string,
  note: string,
): Promise<StaffPickActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await switchAdminStaffPick(from, to.trim(), nullable(note));

    refreshStaffPicks();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to switch staff pick.",
    };
  }
}

export async function deleteStaffPickAction(
  mangaId: string,
): Promise<StaffPickActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await deleteAdminStaffPick(mangaId);

    refreshStaffPicks();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to remove staff pick.",
    };
  }
}
