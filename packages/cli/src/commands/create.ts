import * as p from "@clack/prompts";
import { BANNER_VARIANTS, type BannerVariant } from "@mangakai/shared";
import color from "picocolors";
import { createBanner, type BannerPayload } from "../api";
import { optionalText, required, validateUrl } from "../prompt";
import { parseDate } from "../status";

function validateWhen(value: string): string | undefined {
  if (value.trim() === "") return "Enter a date, or press Esc to skip.";

  return parseDate(value)
    ? undefined
    : "Use a date like 2026-09-01T22:00:00Z or 2026-09-01 22:00.";
}

export interface CreateFlags {
  title: string;
  body?: string;
  variant?: string;
  link?: string;
  label?: string;
  image?: string;
  starts?: string;
  ends?: string;
  draft?: boolean;
}

function isVariant(value: string): value is BannerVariant {
  return (BANNER_VARIANTS as readonly string[]).includes(value);
}

function toIso(value: string, field: string): string {
  const parsed = parseDate(value);

  if (!parsed) {
    throw new Error(
      `--${field} must be a date like 2026-09-01T22:00:00Z, not "${value}".`,
    );
  }

  return parsed.toISOString();
}

/** Scriptable path: no prompts, everything comes from flags. */
export async function createFromFlags(flags: CreateFlags): Promise<void> {
  if (flags.variant && !isVariant(flags.variant)) {
    throw new Error(
      `--variant must be one of ${BANNER_VARIANTS.join(", ")}, not "${flags.variant}".`,
    );
  }

  if (flags.label && !flags.link) {
    throw new Error("--label needs --link to go with it.");
  }

  const banner = await createBanner({
    title: flags.title,
    body: flags.body ?? null,
    variant: flags.variant as BannerVariant | undefined,
    linkUrl: flags.link ?? null,
    linkLabel: flags.label ?? null,
    imageUrl: flags.image ?? null,
    active: !flags.draft,
    startsAt: flags.starts ? toIso(flags.starts, "starts") : null,
    endsAt: flags.ends ? toIso(flags.ends, "ends") : null,
  });

  console.log(
    `${color.green("✔")} ${flags.draft ? "Draft saved" : "Banner published"} ${color.dim(banner.id)}`,
  );
}

export async function createCommand(): Promise<void> {
  p.intro(color.bgMagenta(color.black(" MangaKai · new banner ")));

  const title = required(
    await p.text({
      message: "Title",
      placeholder: "Server maintenance tonight",
      validate: (value) => {
        const trimmed = value?.trim() ?? "";

        if (trimmed === "") return "A title is required.";
        if (trimmed.length > 120) return "Keep it to 120 characters or fewer.";

        return undefined;
      },
    }),
  );

  const body = required(
    await p.text({
      message: "Body",
      placeholder: "Expect brief downtime at 02:00 UTC. (optional)",
      defaultValue: "",
    }),
  );

  const variant = required(
    await p.select<BannerVariant>({
      message: "Style",
      initialValue: "info",
      options: [
        { value: "info", label: "Info", hint: "sky · shown as “Notice”" },
        {
          value: "announcement",
          label: "Announcement",
          hint: "violet · for launches and news",
        },
        {
          value: "warning",
          label: "Warning",
          hint: "amber · shown as “Heads up”",
        },
      ],
    }),
  );

  const payload: BannerPayload = {
    title: title.trim(),
    body: optionalText(body),
    variant,
  };

  if (
    required(
      await p.confirm({ message: "Add a link button?", initialValue: false }),
    )
  ) {
    payload.linkUrl = required(
      await p.text({
        message: "Link URL",
        placeholder: "https://status.mangakai.example",
        validate: validateUrl,
      }),
    ).trim();

    payload.linkLabel = optionalText(
      required(
        await p.text({
          message: "Button label",
          placeholder: "Learn more (optional)",
          defaultValue: "",
        }),
      ),
    );
  }

  if (
    required(await p.confirm({ message: "Add an image?", initialValue: false }))
  ) {
    payload.imageUrl = required(
      await p.text({
        message: "Image URL",
        placeholder: "https://mangakai.example/img/notice.png",
        validate: validateUrl,
      }),
    ).trim();
  }

  if (
    required(
      await p.confirm({
        message: "Schedule a start/end?",
        initialValue: false,
      }),
    )
  ) {
    const startsAt = required(
      await p.text({
        message: "Starts at",
        placeholder: "2026-09-01T22:00:00Z — leave blank for immediately",
        defaultValue: "",
      }),
    );

    if (startsAt.trim()) {
      const parsed = parseDate(startsAt);

      if (!parsed) {
        p.cancel(validateWhen(startsAt)!);
        process.exit(1);
      }

      payload.startsAt = parsed.toISOString();
    }

    const endsAt = required(
      await p.text({
        message: "Ends at",
        placeholder: "2026-09-02T02:00:00Z — leave blank for never",
        defaultValue: "",
      }),
    );

    if (endsAt.trim()) {
      const parsed = parseDate(endsAt);

      if (!parsed) {
        p.cancel(validateWhen(endsAt)!);
        process.exit(1);
      }

      payload.endsAt = parsed.toISOString();
    }

    if (
      payload.startsAt &&
      payload.endsAt &&
      payload.endsAt <= payload.startsAt
    ) {
      p.cancel("The end time must be after the start time.");
      process.exit(1);
    }
  }

  payload.active = required(
    await p.confirm({
      message: "Publish now?",
      initialValue: true,
    }),
  );

  p.note(
    [
      `${color.dim("title")}    ${payload.title}`,
      `${color.dim("body")}     ${payload.body ?? color.dim("—")}`,
      `${color.dim("style")}    ${payload.variant}`,
      `${color.dim("link")}     ${payload.linkUrl ?? color.dim("—")}`,
      `${color.dim("image")}    ${payload.imageUrl ?? color.dim("—")}`,
      `${color.dim("starts")}   ${payload.startsAt ?? color.dim("immediately")}`,
      `${color.dim("ends")}     ${payload.endsAt ?? color.dim("never")}`,
      `${color.dim("status")}   ${payload.active ? color.green("publish now") : color.dim("save as draft")}`,
    ].join("\n"),
    "Review",
  );

  if (!required(await p.confirm({ message: "Create this banner?" }))) {
    p.cancel("Cancelled. No banner was created.");
    process.exit(0);
  }

  const spinner = p.spinner();

  spinner.start("Creating banner");

  const banner = await createBanner(payload).catch((error: unknown) => {
    spinner.stop("Failed to create banner");
    throw error;
  });

  spinner.stop(
    payload.active
      ? "Banner created and pushed to every open tab"
      : "Draft saved",
  );

  p.outro(
    `${color.dim("id")} ${banner.id}\n` +
      (payload.active
        ? "  It is live now — no refresh needed."
        : "  Publish it later with: pnpm banner publish " + banner.id),
  );
}
