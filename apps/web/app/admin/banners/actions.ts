"use server";

import { revalidatePath } from "next/cache";
import type { BannerVariant } from "@mangakai/shared";
import {
  createAdminBanner,
  deleteAdminBanner,
  updateAdminBanner,
} from "@/lib/admin-api";
import { getCurrentUser } from "@/lib/session";

export interface BannerFormInput {
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  linkLabel: string;
  variant: BannerVariant;
  active: boolean;
  startsAt: string;
  endsAt: string;
}

interface BannerActionResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<boolean> {
  const user = await getCurrentUser();

  return user?.role === "admin";
}

function nullable(value: string): string | null {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function bannerPayload(input: BannerFormInput) {
  return {
    title: input.title.trim(),
    body: nullable(input.body),
    imageUrl: nullable(input.imageUrl),
    linkUrl: nullable(input.linkUrl),
    linkLabel: nullable(input.linkLabel),
    variant: input.variant,
    active: input.active,
    startsAt: input.startsAt ? new Date(input.startsAt).toISOString() : null,
    endsAt: input.endsAt ? new Date(input.endsAt).toISOString() : null,
  };
}

function refreshAdminBanners(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/banners");
}

export async function createBannerAction(
  input: BannerFormInput,
): Promise<BannerActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await createAdminBanner(bannerPayload(input));
    refreshAdminBanners();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to create banner.",
    };
  }
}

export async function updateBannerAction(
  id: string,
  input: BannerFormInput,
): Promise<BannerActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await updateAdminBanner(id, bannerPayload(input));
    refreshAdminBanners();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to update banner.",
    };
  }
}

export async function deleteBannerAction(
  id: string,
): Promise<BannerActionResult> {
  if (!(await requireAdmin())) {
    return {
      ok: false,
      error: "Administrator access required.",
    };
  }

  try {
    await deleteAdminBanner(id);
    refreshAdminBanners();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to delete banner.",
    };
  }
}
