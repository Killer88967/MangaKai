import * as p from "@clack/prompts";
import type { AdminBanner } from "@mangakai/shared";
import color from "picocolors";
import { deleteBanner, listBanners, updateBanner } from "../api";
import { bannerStatus, formatStatus } from "../status";

function shortId(id: string) {
  return id.slice(0, 8);
}

function summarise(banner: AdminBanner) {
  const window = [
    banner.startsAt
      ? `from ${banner.startsAt.slice(0, 16).replace("T", " ")}`
      : "",
    banner.endsAt
      ? `until ${banner.endsAt.slice(0, 16).replace("T", " ")}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return [banner.variant, window].filter(Boolean).join(" · ");
}

export async function listCommand(): Promise<void> {
  const banners = await listBanners();

  if (banners.length === 0) {
    console.log(color.dim("\n  No banners yet. Create one: pnpm banner new\n"));
    return;
  }

  console.log();

  for (const banner of banners) {
    console.log(
      `  ${formatStatus(bannerStatus(banner))} ${color.dim(shortId(banner.id))}  ${banner.title}`,
    );
    console.log(`  ${" ".repeat(9)} ${color.dim(summarise(banner))}`);
  }

  console.log(
    color.dim(
      `\n  ${banners.length} banner(s). Full ids: pnpm banner list --json\n`,
    ),
  );
}

export async function listJsonCommand(): Promise<void> {
  console.log(JSON.stringify(await listBanners(), null, 2));
}

/** Shared picker for the commands that act on one existing banner. */
async function pickBanner(
  message: string,
  filter?: (banner: AdminBanner) => boolean,
): Promise<AdminBanner> {
  const all = await listBanners();
  const banners = filter ? all.filter(filter) : all;

  if (banners.length === 0) {
    p.cancel("There are no matching banners.");
    process.exit(0);
  }

  const choice = await p.select<string>({
    message,
    options: banners.map((banner) => ({
      value: banner.id,
      label: banner.title,
      hint: `${bannerStatus(banner)} · ${shortId(banner.id)}`,
    })),
  });

  if (p.isCancel(choice)) {
    p.cancel("Cancelled.");
    process.exit(0);
  }

  return banners.find((banner) => banner.id === choice)!;
}

export async function deleteCommand(id?: string): Promise<void> {
  p.intro(color.bgRed(color.black(" MangaKai · delete banner ")));

  const banner = id
    ? (await listBanners()).find(
        (item) => item.id === id || item.id.startsWith(id),
      )
    : await pickBanner("Which banner should be deleted?");

  if (!banner) {
    p.cancel(`No banner found matching "${id}".`);
    process.exit(1);
  }

  const confirmed = await p.confirm({
    message: `Permanently delete ${color.bold(banner.title)}?`,
    initialValue: false,
  });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Cancelled. Nothing was deleted.");
    process.exit(0);
  }

  await deleteBanner(banner.id);

  p.outro("Deleted.");
}

export async function setActiveCommand(
  active: boolean,
  id?: string,
): Promise<void> {
  const verb = active ? "publish" : "unpublish";

  p.intro(color.bgMagenta(color.black(` MangaKai · ${verb} banner `)));

  const banner = id
    ? (await listBanners()).find(
        (item) => item.id === id || item.id.startsWith(id),
      )
    : await pickBanner(
        `Which banner should be ${active ? "published" : "unpublished"}?`,
        (item) => item.active !== active,
      );

  if (!banner) {
    p.cancel(`No banner found matching "${id}".`);
    process.exit(1);
  }

  await updateBanner(banner.id, { active });

  p.outro(
    active
      ? `${color.bold(banner.title)} is live now.`
      : `${color.bold(banner.title)} is hidden but kept as a draft.`,
  );
}

/**
 * Retires one banner and publishes another in a single step.
 *
 * The new banner goes live *before* the old one is hidden. The reverse order
 * leaves a moment with nothing on the page, and since clients are subscribed
 * to the banner stream they would see the gap flicker past.
 */
export async function switchCommand(
  fromId?: string,
  toId?: string,
): Promise<void> {
  p.intro(color.bgMagenta(color.black(" MangaKai · switch banner ")));

  const all = await listBanners();
  const find = (id: string) =>
    all.find((item) => item.id === id || item.id.startsWith(id));

  const from = fromId
    ? find(fromId)
    : await pickBanner(
        "Which banner should be retired?",
        (item) => item.active,
      );

  if (!from) {
    p.cancel(`No banner found matching "${fromId}".`);
    process.exit(1);
  }

  const to = toId
    ? find(toId)
    : await pickBanner(
        "Which banner should replace it?",
        (item) => item.id !== from.id,
      );

  if (!to) {
    p.cancel(`No banner found matching "${toId}".`);
    process.exit(1);
  }

  if (to.id === from.id) {
    p.cancel("That is the same banner. Nothing to switch.");
    process.exit(1);
  }

  p.note(
    `${color.dim("out")}  ${from.title}\n${color.dim("in")}   ${to.title}`,
    "Switch",
  );

  const confirmed = await p.confirm({ message: "Apply this switch?" });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Cancelled. Nothing changed.");
    process.exit(0);
  }

  await updateBanner(to.id, { active: true });
  await updateBanner(from.id, { active: false });

  p.outro(`${color.bold(to.title)} is live. ${from.title} is now a draft.`);
}
