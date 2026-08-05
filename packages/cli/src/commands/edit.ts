import * as p from "@clack/prompts";
import {
  BANNER_VARIANTS,
  type AdminBanner,
  type BannerVariant,
} from "@mangakai/shared";
import color from "picocolors";
import { listBanners, updateBanner, type BannerPayload } from "../api";
import {
  display,
  optionalText,
  required,
  validateOptionalDate,
  validateOptionalUrl,
} from "../prompt";
import { bannerStatus, parseDate } from "../status";

type EditableField = keyof Pick<
  BannerPayload,
  | "title"
  | "body"
  | "variant"
  | "linkUrl"
  | "linkLabel"
  | "imageUrl"
  | "startsAt"
  | "endsAt"
  | "active"
>;

const fieldLabels: Record<EditableField, string> = {
  title: "Title",
  body: "Body",
  variant: "Style",
  linkUrl: "Link URL",
  linkLabel: "Button label",
  imageUrl: "Image URL",
  startsAt: "Starts at",
  endsAt: "Ends at",
  active: "Published",
};

const EDITABLE_FIELDS = Object.keys(fieldLabels) as EditableField[];

type FieldValue = string | boolean | null;

function currentValue(banner: AdminBanner, field: EditableField): FieldValue {
  return banner[field] ?? null;
}

/** Free-text prompt pre-filled with the current value; blank clears it. */
async function askText(
  field: EditableField,
  banner: AdminBanner,
  validate?: (value: string | undefined) => string | undefined,
): Promise<string | null> {
  const current = currentValue(banner, field);

  const answer = required(
    await p.text({
      message: `${fieldLabels[field]} ${color.dim("(blank to clear)")}`,
      initialValue: typeof current === "string" ? current : "",
      defaultValue: "",
      validate,
    }),
  );

  return optionalText(answer);
}

async function askDate(
  field: "startsAt" | "endsAt",
  banner: AdminBanner,
): Promise<string | null> {
  const value = await askText(field, banner, validateOptionalDate);

  return value ? parseDate(value)!.toISOString() : null;
}

/**
 * Returns a patch fragment for one field. Returning the fragment rather than a
 * bare value keeps every assignment typed — no casts into `BannerPayload`.
 */
async function promptField(
  field: EditableField,
  banner: AdminBanner,
): Promise<Partial<BannerPayload>> {
  switch (field) {
    case "active":
      return {
        active: required(
          await p.confirm({
            message: "Published?",
            initialValue: banner.active,
          }),
        ),
      };

    case "variant":
      return {
        variant: required(
          await p.select<BannerVariant>({
            message: "Style",
            initialValue: banner.variant,
            options: BANNER_VARIANTS.map((value) => ({
              value,
              label: value[0]!.toUpperCase() + value.slice(1),
            })),
          }),
        ),
      };

    case "title":
      return {
        title: required(
          await p.text({
            message: "Title",
            initialValue: banner.title,
            validate: (value) => {
              const trimmed = value?.trim() ?? "";

              if (trimmed === "") return "A title is required.";
              if (trimmed.length > 120)
                return "Keep it to 120 characters or fewer.";

              return undefined;
            },
          }),
        ).trim(),
      };

    case "body":
      return { body: await askText(field, banner) };

    case "linkLabel":
      return { linkLabel: await askText(field, banner) };

    case "linkUrl":
      return { linkUrl: await askText(field, banner, validateOptionalUrl) };

    case "imageUrl":
      return { imageUrl: await askText(field, banner, validateOptionalUrl) };

    case "startsAt":
      return { startsAt: await askDate(field, banner) };

    case "endsAt":
      return { endsAt: await askDate(field, banner) };
  }
}

async function resolveBanner(
  banners: AdminBanner[],
  id: string | undefined,
): Promise<AdminBanner | undefined> {
  if (id) {
    return banners.find((item) => item.id === id || item.id.startsWith(id));
  }

  const chosen = required(
    await p.select<string>({
      message: "Which banner do you want to edit?",
      options: banners.map((item) => ({
        value: item.id,
        label: item.title,
        hint: `${bannerStatus(item)} · ${item.id.slice(0, 8)}`,
      })),
    }),
  );

  return banners.find((item) => item.id === chosen);
}

export async function editCommand(id?: string): Promise<void> {
  p.intro(color.bgMagenta(color.black(" MangaKai · edit banner ")));

  const banners = await listBanners();

  if (banners.length === 0) {
    p.cancel("There are no banners yet. Create one with: pnpm banner");
    process.exit(0);
  }

  const banner = await resolveBanner(banners, id);

  if (!banner) {
    p.cancel(`No banner found matching "${id}".`);
    process.exit(1);
  }

  p.note(
    EDITABLE_FIELDS.map(
      (field) =>
        `${color.dim(fieldLabels[field].padEnd(13))}${display(currentValue(banner, field))}`,
    ).join("\n"),
    `Current values ${color.dim(banner.id)}`,
  );

  const chosen = required(
    await p.multiselect<EditableField>({
      message: "What do you want to change?",
      options: EDITABLE_FIELDS.map((field) => ({
        value: field,
        label: fieldLabels[field],
        hint: display(currentValue(banner, field)),
      })),
      required: true,
    }),
  );

  const patch: Partial<BannerPayload> = {};
  const changes: string[] = [];

  for (const field of chosen) {
    const before = currentValue(banner, field);
    const fragment = await promptField(field, banner);
    const after = fragment[field] ?? null;

    if (after === before) continue;

    Object.assign(patch, fragment);

    changes.push(
      `${color.dim(fieldLabels[field].padEnd(13))}${display(before)} ${color.dim("→")} ${display(after)}`,
    );
  }

  if (changes.length === 0) {
    p.cancel("Nothing changed. The banner was left alone.");
    process.exit(0);
  }

  const startsAt = patch.startsAt ?? banner.startsAt;
  const endsAt = patch.endsAt ?? banner.endsAt;

  if (startsAt && endsAt && endsAt <= startsAt) {
    p.cancel("The end time must be after the start time.");
    process.exit(1);
  }

  p.note(changes.join("\n"), "Changes");

  if (!required(await p.confirm({ message: "Apply these changes?" }))) {
    p.cancel("Cancelled. Nothing was changed.");
    process.exit(0);
  }

  const spinner = p.spinner();

  spinner.start("Saving");

  const updated = await updateBanner(banner.id, patch).catch(
    (error: unknown) => {
      spinner.stop("Failed to save");
      throw error;
    },
  );

  spinner.stop("Saved and pushed to every open tab");

  p.outro(
    `${color.dim("id")} ${updated.id}\n  Now ${bannerStatus(updated)} — no refresh needed.`,
  );
}
